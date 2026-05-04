import { z } from 'zod'
import { latitudeNumberSchema, longitudeNumberSchema } from './common'

const productTypeSchema = z.enum(['coupon', 'voucher', 'ticket'])
const fulfillmentTypeSchema = z.enum(['fixed_price', 'reservation'])

function fulfillmentTypeForProductType(productType: z.infer<typeof productTypeSchema>) {
  return productType === 'coupon' ? 'reservation' : 'fixed_price'
}

function withProductTypeDefaults<T extends { product_type?: z.infer<typeof productTypeSchema>; fulfillment_type?: z.infer<typeof fulfillmentTypeSchema> }>(data: T): T {
  if (data.product_type) {
    return { ...data, fulfillment_type: fulfillmentTypeForProductType(data.product_type) }
  }
  if (data.fulfillment_type) {
    return { ...data, product_type: data.fulfillment_type === 'reservation' ? 'coupon' : 'voucher' }
  }
  return data
}

// ─── Create Service ────────────────────────────────────
export const createServiceSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Slug phải là chữ thường, số và dấu gạch ngang'),
  category_id: z.string().uuid('ID danh mục không hợp lệ'),
  description: z.string().max(2000).optional(),
  original_price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Giá không hợp lệ'),
  discount_price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  discount_percent: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  product_type: productTypeSchema.optional(),
  fulfillment_type: fulfillmentTypeSchema.default('fixed_price'),
  reservation_discount_percent: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  duration_minutes: z.coerce.number().int().min(1).optional(),
  max_quantity_per_order: z.coerce.number().int().min(1).max(100).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  options: z.record(z.unknown()).optional(),
}).transform(withProductTypeDefaults)
export type CreateServiceInput = z.infer<typeof createServiceSchema>

// ─── Update Service ────────────────────────────────────
export const updateServiceSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  category_id: z.string().uuid('ID danh mục không hợp lệ').optional(),
  description: z.string().max(2000).optional(),
  original_price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  discount_price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .nullable()
    .optional(),
  discount_percent: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .nullable()
    .optional(),
  product_type: productTypeSchema.optional(),
  fulfillment_type: fulfillmentTypeSchema.optional(),
  reservation_discount_percent: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .nullable()
    .optional(),
  duration_minutes: z.coerce.number().int().min(1).nullable().optional(),
  max_quantity_per_order: z.coerce.number().int().min(1).max(100).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  options: z.record(z.unknown()).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
}).transform(withProductTypeDefaults)
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
  origin_latitude: latitudeNumberSchema.optional(),
  origin_longitude: longitudeNumberSchema.optional(),
  sort: z
    .enum(['relevance', 'price_asc', 'price_desc', 'rating_desc', 'newest', 'distance_asc'])
    .default('relevance'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type ServiceFilterInput = z.infer<typeof serviceFilterSchema>
