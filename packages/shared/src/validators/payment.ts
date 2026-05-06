import { z } from 'zod'

// ─── Initiate Payment ──────────────────────────────────
export const initiatePaymentSchema = z.object({
  order_id: z.string().uuid(),
  gateway: z.enum(['vnpay', 'momo', 'sepay']),
  return_url: z.string().url().optional(),
})
export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>

// ─── Refund Request ────────────────────────────────────
export const refundRequestSchema = z.object({
  voucher_id: z.string().uuid(),
  reason: z.string().max(500).optional(),
})
export type RefundRequestInput = z.infer<typeof refundRequestSchema>

// ─── Complete Manual Refund ─────────────────────────────
export const completeRefundSchema = z.object({
  gateway_refund_id: z.string().max(255).optional(),
  note: z.string().max(500).optional(),
})
export type CompleteRefundInput = z.infer<typeof completeRefundSchema>
