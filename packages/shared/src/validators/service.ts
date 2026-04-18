import { z } from 'zod'

// ─── Create Service ────────────────────────────────────
export const createServiceSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/, 'Slug phải là chữ thường, số và dấu gạch ngang'),
  category_id: z.string().uuid('ID danh mục không hợp lệ'),
  description: z.string().max(2000).optional(),
  original_price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Giá không hợp lệ'),
  discount_price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  discount_percent: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  duration_minutes: z.coerce.number().int().min(1).optional(),
  max_quantity_per_order: z.coerce.number().int().min(1).max(100).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  options: z.record(z.unknown()).optional(),
})
export type CreateServiceInput = z.infer<typeof createServiceSchema>

// ─── Update Service ────────────────────────────────────
export const updateServiceSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  original_price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  discount_price: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
  discount_percent: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
  duration_minutes: z.coerce.number().int().min(1).nullable().optional(),
  max_quantity_per_order: z.coerce.number().int().min(1).max(100).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  options: z.record(z.unknown()).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
})
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>

// ─── Service Filters ───────────────────────────────────
export const serviceFilterSchema = z.object({
  q: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  min_rating: z.coerce.number().min(0).max(5).optional(),
  min_distance: z.coerce.number().min(0).optional(), // km from Tây An beach
  max_distance: z.coerce.number().min(0).optional(),
  sort: z.enum(['relevance', 'price_asc', 'price_desc', 'rating_desc', 'newest', 'distance_asc']).default('relevance'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type ServiceFilterInput = z.infer<typeof serviceFilterSchema>
