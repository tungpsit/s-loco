import { orderItems, orders, payments, vouchers } from '@S-Loco/db/schema'
import { and, eq, lt } from 'drizzle-orm'
import { getDb } from '../db'
import { momoGateway } from '../gateways/momo'
import { sepayGateway } from '../gateways/sepay'
import { vnpayGateway } from '../gateways/vnpay'
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
  const { paymentUrl, transactionId } = await gw.createPaymentUrl({
    orderId,
    amount: Math.round(Number(order.finalAmount)),
    description: `S-Loco #${orderId.slice(0, 8)}`,
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
    if (result.success) {
      await handlePaymentSuccess(payment.id, payment.orderId)
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
    throw err
  }

  return { status: 'ok' }
}

// ─── Handle successful payment ─────────────────────────
async function handlePaymentSuccess(paymentId: string, orderId: string) {
  const db = getDb()

  await db.transaction(async (tx) => {
    // Update payment
    await tx
      .update(payments)
      .set({ status: 'success', paidAt: new Date(), updatedAt: new Date() })
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
      await gw.processRefund({
        transactionId: payment.gatewayTransactionId,
        amount: Math.round(Number(item.unitPrice)),
        originalAmount,
        reason,
      })
    }
  }

  // Update voucher status
  await db
    .update(vouchers)
    .set({ status: 'refunded', updatedAt: new Date() })
    .where(eq(vouchers.id, voucherId))

  return { success: true, message: 'Yêu cầu hoàn tiền đã được xử lý.' }
}

// ─── Poll pending payments ─────────────────────────────
export async function pollPendingPayments() {
  const db = getDb()
  const cutoff = new Date(Date.now() - 30 * 60 * 1000) // 30 min stale

  const stale = await db
    .select()
    .from(payments)
    .where(and(eq(payments.status, 'pending'), lt(payments.createdAt, cutoff)))

  console.log(`[PayPoll] Found ${stale.length} stale pending payment(s)`)

  // In production, would query each gateway for real status
  // For now, mark as failed after 30 min
  for (const p of stale) {
    await db
      .update(payments)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(eq(payments.id, p.id))
  }

  return { checked: stale.length }
}

export class PaymentError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'PaymentError'
  }
}
