import { getDb } from '../db'
import { orderItems, orders, payments, refunds, vouchers } from '@S-Loco/db/schema'
import { and, eq } from 'drizzle-orm'
import { momoGateway } from '../gateways/momo'
import { sepayGateway } from '../gateways/sepay'
import { vnpayGateway } from '../gateways/vnpay'
import type { PaymentGateway } from './payment-gateway'
import { assertTransition } from './voucher-state'

// ---- Gateway registry -----------------------------------
const gateways: Record<string, PaymentGateway> = {
  vnpay: vnpayGateway,
  momo: momoGateway,
  sepay: sepayGateway,
}

// ---- Partial Refund (single voucher) -----------------
export async function requestPartialRefund(
  voucherId: string,
  userId: string,
  reason?: string,
) {
  const db = getDb()

  // Gate: voucher must be PAID and owned by user
  const [v] = await db
    .select()
    .from(vouchers)
    .where(and(eq(vouchers.id, voucherId), eq(vouchers.userId, userId)))
    .limit(1)
  if (!v) throw new RefundError('NOT_FOUND', 'Voucher không tồn tại.')

  assertTransition(v.status, 'refunded')

  // Get order item to find order + payment
  const [item] = await db.select().from(orderItems).where(eq(orderItems.id, v.orderItemId)).limit(1)
  if (!item) throw new RefundError('NOT_FOUND', 'Order item không tồn tại.')

  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.orderId, item.orderId), eq(payments.status, 'success')))
    .limit(1)

  const refundAmount = Math.round(Number(item.unitPrice))

  // Process refund through gateway
  if (payment?.gateway && payment.gatewayTransactionId) {
    const gw = gateways[payment.gateway]
    if (gw) {
      await gw.processRefund({
        transactionId: payment.gatewayTransactionId,
        amount: refundAmount,
        originalAmount: Number(payment.amount),
        gatewayTransactionId: payment.gatewayTransactionId,
        reason,
      })
    }
  }

  // Insert refund record
  if (payment) {
    await db.insert(refunds).values({
      voucherId,
      paymentId: payment.id,
      amount: String(refundAmount),
      gateway: payment.gateway,
      status: 'success',
      reason,
      initiatedBy: userId,
    })
  }

  // Update voucher status to refunded (does NOT cancel the order)
  await db
    .update(vouchers)
    .set({ status: 'refunded', updatedAt: new Date() })
    .where(eq(vouchers.id, voucherId))

  return { success: true, message: 'Hoàn tiền voucher đã được xử lý.', voucherId, amount: refundAmount }
}

// ---- Refund Error --------------------------------------
export class RefundError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'RefundError'
  }
}
