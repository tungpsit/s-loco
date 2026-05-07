import { orderItems, orders, payments, refunds, vouchers } from '@S-Loco/db/schema'
import { and, eq, lt } from 'drizzle-orm'
import { getDb } from '../db'
import { momoGateway } from '../gateways/momo'
import { sepayGateway } from '../gateways/sepay'
import { vnpayGateway } from '../gateways/vnpay'
import {
  notifyAdminsRefundCompleted,
  notifyAdminsRefundRequested,
  notifyAdminsWebhookFailed,
} from './admin-notification.service'
import { notifyOrderPaid } from './notification.service'
import type { PaymentGateway } from './payment-gateway'
import { generateQrToken } from './voucher.service'
import { assertTransition } from './voucher-state'
import { enqueueWebhookRetry } from './webhook-retry.service'

const APP_URL = process.env.APP_URL || 'http://localhost:3000'

// ─── Gateway registry ──────────────────────────────────
const gateways: Record<string, PaymentGateway> = {
  vnpay: vnpayGateway,
  momo: momoGateway,
  sepay: sepayGateway,
}

// ─── Initiate payment ──────────────────────────────────
export async function initiatePayment(
  orderId: string,
  userId: string,
  gateway: string,
  ipAddress?: string,
) {
  const db = getDb()

  // Verify order
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId), eq(orders.status, 'created')))
    .limit(1)
  if (!order) throw new PaymentError('NOT_FOUND', 'Đơn hàng không tồn tại hoặc đã thanh toán.')

  const gw = gateways[gateway]
  if (!gw) throw new PaymentError('INVALID_GATEWAY', 'Phương thức thanh toán không hợp lệ.')

  const idempotencyKey = `${orderId}_${gateway}_${Date.now()}`

  // Create payment record
  const orderNumber = order.orderNumber || orderId
  const { paymentUrl, transactionId } = await gw.createPaymentUrl({
    orderId,
    orderNumber,
    amount: Math.round(Number(order.finalAmount)),
    description: `S-Loco #${orderNumber}`,
    returnUrl: `${APP_URL}/api/v1/payments/return`,
    ipnUrl: `${APP_URL}/api/v1/payments/webhook/${gateway}`,
    ipAddress,
  })

  await db.insert(payments).values({
    orderId,
    gateway: gateway as any,
    gatewayTransactionId: transactionId,
    amount: order.finalAmount,
    status: 'pending',
    idempotencyKey,
    paymentUrl,
  })

  return { paymentUrl, transactionId }
}

// ─── Process webhook (idempotent, with retry queue) ──
export async function processWebhook(
  gateway: string,
  payload: Record<string, unknown>,
  signature: string,
) {
  const gw = gateways[gateway]
  if (!gw) throw new PaymentError('INVALID_GATEWAY', 'Gateway không hợp lệ.')

  // 1. Verify signature
  if (!gw.verifyWebhook(payload, signature)) {
    throw new PaymentError('INVALID_SIGNATURE', 'Chữ ký webhook không hợp lệ.')
  }

  // 2. Parse result
  const result = gw.parseWebhookResult(payload)

  // 3. Find payment by transaction ID
  const db = getDb()
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.gatewayTransactionId, result.transactionId))
    .limit(1)

  if (!payment) {
    console.warn(`[Webhook] Payment not found for transaction: ${result.transactionId}`)
    return { status: 'not_found' }
  }

  // 4. Idempotency check — already processed
  if (payment.status !== 'pending') {
    return { status: 'already_processed' }
  }

  // 5. Update payment + order + vouchers (wrapped for retry queue)
  try {
    const expectedAmount = Math.round(Number(payment.amount))
    const receivedAmount = Math.round(result.amount)
    if (result.success && expectedAmount !== receivedAmount) {
      await db
        .update(payments)
        .set({ rawWebhook: result.rawData, updatedAt: new Date() })
        .where(eq(payments.id, payment.id))
      void notifyAdminsWebhookFailed({
        gateway,
        code: 'AMOUNT_MISMATCH',
        message: `Kỳ vọng ${expectedAmount}, nhận ${receivedAmount}`,
        transactionId: result.transactionId,
      }).catch((err) => {
        console.error('[AdminNotification] Failed to notify amount mismatch:', err)
      })
      throw new PaymentError('AMOUNT_MISMATCH', 'Số tiền thanh toán không khớp với đơn hàng.')
    }

    if (result.success) {
      await handlePaymentSuccess(payment.id, payment.orderId, result.rawData)
    } else {
      await db
        .update(payments)
        .set({ status: 'failed', rawWebhook: result.rawData, updatedAt: new Date() })
        .where(eq(payments.id, payment.id))
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[Webhook] ${gateway} processing error: ${msg}`)
    await enqueueWebhookRetry(gateway, payload, signature, msg)
    void notifyAdminsWebhookFailed({
      gateway,
      code: err instanceof PaymentError ? err.code : undefined,
      message: msg,
      transactionId: result.transactionId,
    }).catch((notifyErr) => {
      console.error('[AdminNotification] Failed to notify webhook failure:', notifyErr)
    })
    throw err
  }

  return { status: 'ok' }
}

// ─── Handle successful payment ─────────────────────────
async function handlePaymentSuccess(
  paymentId: string,
  orderId: string,
  rawWebhook?: Record<string, unknown>,
) {
  const db = getDb()

  await db.transaction(async (tx) => {
    // Update payment
    await tx
      .update(payments)
      .set({ status: 'success', paidAt: new Date(), rawWebhook, updatedAt: new Date() })
      .where(eq(payments.id, paymentId))

    // Update order
    await tx
      .update(orders)
      .set({ status: 'paid', updatedAt: new Date() })
      .where(eq(orders.id, orderId))

    // Update vouchers: CREATED → PAID + generate QR tokens
    const voucherRows = await tx
      .select({ id: vouchers.id, expiresAt: vouchers.expiresAt })
      .from(vouchers)
      .innerJoin(orderItems, eq(vouchers.orderItemId, orderItems.id))
      .where(and(eq(orderItems.orderId, orderId), eq(vouchers.status, 'created')))

    for (const v of voucherRows) {
      const qrToken = await generateQrToken(v.id, v.expiresAt)
      await tx
        .update(vouchers)
        .set({ status: 'paid', qrToken, updatedAt: new Date() })
        .where(eq(vouchers.id, v.id))
    }
  })

  void notifyOrderPaid(orderId).catch((err) => {
    console.error(`[Notification] Failed to notify paid order ${orderId}:`, err)
  })
}

// ─── Request refund ────────────────────────────────────
export async function requestRefund(voucherId: string, userId: string, reason?: string) {
  const db = getDb()

  // Check voucher ownership and status
  const [v] = await db
    .select()
    .from(vouchers)
    .where(and(eq(vouchers.id, voucherId), eq(vouchers.userId, userId)))
    .limit(1)
  if (!v) throw new PaymentError('NOT_FOUND', 'Voucher không tồn tại.')

  // Only PAID vouchers can be refunded
  assertTransition(v.status, 'refunded')

  // Find the payment for this voucher's order
  const [item] = await db.select().from(orderItems).where(eq(orderItems.id, v.orderItemId)).limit(1)
  if (!item) throw new PaymentError('NOT_FOUND', 'Order item không tồn tại.')

  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.orderId, item.orderId), eq(payments.status, 'success')))
    .limit(1)

  // Get order for originalAmount (total paid)
  const [order] = await db.select().from(orders).where(eq(orders.id, item.orderId)).limit(1)
  const originalAmount = order ? Math.round(Number(order.finalAmount)) : 0

  // Process refund through gateway
  if (payment?.gateway) {
    const gw = gateways[payment.gateway]
    if (gw && payment.gatewayTransactionId) {
      const refundResult = await gw.processRefund({
        transactionId: payment.gatewayTransactionId,
        amount: Math.round(Number(item.unitPrice)),
        originalAmount,
        reason,
      })
      const completion = getRefundCompletionStatus(payment.gateway, refundResult.success)

      let refundId: string | undefined
      await db.transaction(async (tx) => {
        const [createdRefund] = await tx
          .insert(refunds)
          .values({
            voucherId,
            paymentId: payment.id,
            amount: item.unitPrice,
            gateway: payment.gateway,
            gatewayRefundId: refundResult.refundTransactionId,
            status: completion.refundStatus,
            reason,
            initiatedBy: userId,
          })
          .returning({ id: refunds.id })
        refundId = createdRefund?.id
        await tx
          .update(vouchers)
          .set({ status: 'refunded', updatedAt: new Date() })
          .where(eq(vouchers.id, voucherId))
        await tx
          .update(payments)
          .set({ status: completion.paymentStatus, updatedAt: new Date() })
          .where(eq(payments.id, payment.id))
        await updateOrderRefundStatus(tx, item.orderId)
      })

      void notifyAdminsRefundRequested({
        refundId,
        voucherId,
        orderId: item.orderId,
        amount: item.unitPrice,
        status: completion.refundStatus,
      }).catch((err) => {
        console.error('[AdminNotification] Failed to notify refund request:', err)
      })

      return { success: true, message: completion.message }
    }
  }

  await db
    .update(vouchers)
    .set({ status: 'refunded', updatedAt: new Date() })
    .where(eq(vouchers.id, voucherId))

  void notifyAdminsRefundRequested({
    voucherId,
    orderId: item.orderId,
    amount: item.unitPrice,
    status: 'manual_processing',
  }).catch((err) => {
    console.error('[AdminNotification] Failed to notify manual refund request:', err)
  })

  return { success: true, message: 'Yêu cầu hoàn tiền đã được ghi nhận.' }
}

export async function completeManualRefund(
  refundId: string,
  input: { gatewayRefundId?: string; note?: string } = {},
) {
  const db = getDb()
  const [refund] = await db.select().from(refunds).where(eq(refunds.id, refundId)).limit(1)
  if (!refund) throw new PaymentError('NOT_FOUND', 'Refund không tồn tại.')

  const completion = getManualRefundCompleteStatus(refund.status)
  if (refund.status !== 'completed') {
    await db.transaction(async (tx) => {
      await tx
        .update(refunds)
        .set({
          status: completion.refundStatus,
          gatewayRefundId: input.gatewayRefundId || refund.gatewayRefundId,
          reason: appendRefundCompletionNote(refund.reason, input.note),
        })
        .where(eq(refunds.id, refundId))

      const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.id, refund.paymentId))
        .limit(1)
      if (payment) {
        const [item] = await tx
          .select({ orderId: orderItems.orderId })
          .from(vouchers)
          .innerJoin(orderItems, eq(vouchers.orderItemId, orderItems.id))
          .where(eq(vouchers.id, refund.voucherId))
          .limit(1)
        if (item) {
          await updateOrderRefundStatus(tx, item.orderId)
          await updatePaymentRefundStatus(tx, payment.id, item.orderId)
        }
      }
    })
  }

  void notifyAdminsRefundCompleted({ refundId, status: completion.refundStatus }).catch((err) => {
    console.error(`[AdminNotification] Failed to notify refund completion ${refundId}:`, err)
  })

  return {
    success: true,
    refundId,
    status: completion.refundStatus,
    message: completion.message,
  }
}

export function getManualRefundCompleteStatus(status: string): {
  refundStatus: 'completed'
  message: string
} {
  if (status === 'completed') {
    return { refundStatus: 'completed', message: 'Refund đã hoàn tất trước đó.' }
  }
  if (status === 'manual_processing' || status === 'pending') {
    return { refundStatus: 'completed', message: 'Refund đã được đánh dấu hoàn tất.' }
  }
  throw new PaymentError('INVALID_REFUND_STATE', 'Refund không ở trạng thái có thể hoàn tất.')
}

export function getRefundCompletionStatus(
  gateway: string,
  gatewaySuccess = true,
): {
  refundStatus: string
  paymentStatus: 'success' | 'refunded'
  message: string
} {
  if (gateway === 'sepay') {
    return {
      refundStatus: 'manual_processing',
      paymentStatus: 'success',
      message: 'Yêu cầu hoàn tiền SePay đã được ghi nhận và cần vận hành xử lý thủ công.',
    }
  }
  if (!gatewaySuccess) {
    return {
      refundStatus: 'failed',
      paymentStatus: 'success',
      message: 'Không thể xử lý hoàn tiền qua cổng thanh toán. Vui lòng thử lại sau.',
    }
  }
  return {
    refundStatus: 'completed',
    paymentStatus: 'refunded',
    message: 'Yêu cầu hoàn tiền đã được xử lý.',
  }
}

export function getPendingPaymentPollDecision(
  createdAt: Date,
  now = new Date(),
  staleAfterMs = 40 * 60 * 1000,
): 'keep_pending' | 'expire' {
  return now.getTime() - createdAt.getTime() >= staleAfterMs ? 'expire' : 'keep_pending'
}

async function updateOrderRefundStatus(tx: any, orderId: string) {
  const voucherRows = await tx
    .select({ status: vouchers.status })
    .from(vouchers)
    .innerJoin(orderItems, eq(vouchers.orderItemId, orderItems.id))
    .where(eq(orderItems.orderId, orderId))
  const allRefunded =
    voucherRows.length > 0 &&
    voucherRows.every((row: { status: string }) => row.status === 'refunded')
  const anyRefunded = voucherRows.some((row: { status: string }) => row.status === 'refunded')
  if (allRefunded || anyRefunded) {
    await tx
      .update(orders)
      .set({ status: allRefunded ? 'refunded' : 'partially_refunded', updatedAt: new Date() })
      .where(eq(orders.id, orderId))
  }
}

async function updatePaymentRefundStatus(tx: any, paymentId: string, orderId: string) {
  const voucherRows = await tx
    .select({ status: vouchers.status })
    .from(vouchers)
    .innerJoin(orderItems, eq(vouchers.orderItemId, orderItems.id))
    .where(eq(orderItems.orderId, orderId))
  const allRefunded =
    voucherRows.length > 0 &&
    voucherRows.every((row: { status: string }) => row.status === 'refunded')
  if (allRefunded) {
    await tx
      .update(payments)
      .set({ status: 'refunded', updatedAt: new Date() })
      .where(eq(payments.id, paymentId))
  }
}

function appendRefundCompletionNote(reason: string | null, note?: string): string | null {
  if (!note?.trim()) return reason
  return [reason, `Admin completion: ${note.trim()}`].filter(Boolean).join('\n')
}

// ─── Poll pending payments ─────────────────────────────
export async function pollPendingPayments() {
  const db = getDb()
  const now = new Date()
  const cutoff = new Date(now.getTime() - 40 * 60 * 1000)

  const stale = await db
    .select()
    .from(payments)
    .where(and(eq(payments.status, 'pending'), lt(payments.createdAt, cutoff)))

  let expired = 0
  console.log(`[PayPoll] Found ${stale.length} stale pending payment(s)`)

  for (const p of stale) {
    if (getPendingPaymentPollDecision(p.createdAt, now) !== 'expire') continue
    await db
      .update(payments)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(eq(payments.id, p.id))
    expired += 1
  }

  return { checked: stale.length, expired }
}

export class PaymentError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'PaymentError'
  }
}
