import { z } from 'zod'

const percentString = z.string().regex(/^\d+(\.\d{1,2})?$/, 'Phần trăm không hợp lệ')

function validateAppDiscountWithinCommission<
  T extends { commission_rate?: string; app_discount_percent?: string },
>(data: T, ctx: z.RefinementCtx) {
  const commission = Number(data.commission_rate ?? '8.00')
  const appDiscount = Number(data.app_discount_percent ?? '5.00')
  if (appDiscount > commission) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['app_discount_percent'],
      message: 'Ưu đãi khách đặt qua app không được lớn hơn hoa hồng vendor.',
    })
  }
}

// ─── Create Vendor (Admin) ─────────────────────────────
export const createVendorSchema = z.object({
  owner_id: z.string().uuid('ID chủ cửa hàng không hợp lệ'),
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/, 'Slug phải là chữ thường, số và dấu gạch ngang'),
  description: z.string().max(2000).optional(),
  address: z.string().max(500).optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  commission_rate: percentString.optional(),
  app_discount_percent: percentString.optional(),
  business_hours: z.record(z.unknown()).optional(),
}).superRefine(validateAppDiscountWithinCommission)
export type CreateVendorInput = z.infer<typeof createVendorSchema>

// ─── Update Vendor (Vendor Owner) ──────────────────────
export const updateVendorSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  address: z.string().max(500).optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  business_hours: z.record(z.unknown()).optional(),
  ipos_store_id: z.string().trim().max(100).optional(),
})
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>

// ─── Update Vendor (Admin) ─────────────────────────────
export const adminUpdateVendorSchema = updateVendorSchema.extend({
  commission_rate: percentString.optional(),
  app_discount_percent: percentString.optional(),
}).superRefine(validateAppDiscountWithinCommission)
export type AdminUpdateVendorInput = z.infer<typeof adminUpdateVendorSchema>

// ─── Update Vendor Status (Admin) ──────────────────────
export const updateVendorStatusSchema = z.object({
  status: z.enum(['pending', 'active', 'suspended', 'rejected']),
  rejection_reason: z.string().max(500).optional(),
})
export type UpdateVendorStatusInput = z.infer<typeof updateVendorStatusSchema>
