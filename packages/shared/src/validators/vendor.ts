import { z } from 'zod'

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
  commission_rate: z.string().optional(),
  business_hours: z.record(z.unknown()).optional(),
})
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
})
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>

// ─── Update Vendor Status (Admin) ──────────────────────
export const updateVendorStatusSchema = z.object({
  status: z.enum(['pending', 'active', 'suspended', 'rejected']),
})
export type UpdateVendorStatusInput = z.infer<typeof updateVendorStatusSchema>
