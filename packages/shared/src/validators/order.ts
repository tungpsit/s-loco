import { z } from 'zod'

// ─── Create Order ──────────────────────────────────────
export const createOrderSchema = z.object({
  items: z.array(z.object({
    service_id: z.string().uuid(),
    quantity: z.coerce.number().int().min(1).max(10),
  })).min(1).max(20),
  note: z.string().max(500).optional(),
})
export type CreateOrderInput = z.infer<typeof createOrderSchema>

// ─── Redeem Voucher ────────────────────────────────────
export const redeemVoucherSchema = z.object({
  qr_token: z.string().min(10),
})
export type RedeemVoucherInput = z.infer<typeof redeemVoucherSchema>

// ─── Self-Redeem Voucher ───────────────────────────────
export const selfRedeemSchema = z.object({
  voucher_id: z.string().uuid(),
  vendor_id: z.string().uuid(),
})
export type SelfRedeemInput = z.infer<typeof selfRedeemSchema>
