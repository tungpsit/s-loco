import { z } from 'zod'

function optionalCoordinate(min: number, max: number, message: string) {
  return z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z
      .string()
      .refine((value) => Number.isFinite(Number(value)), message)
      .refine((value) => Number(value) >= min && Number(value) <= max, message)
      .optional(),
  )
}

export const latitudeStringSchema = optionalCoordinate(-90, 90, 'Vĩ độ không hợp lệ')
export const longitudeStringSchema = optionalCoordinate(-180, 180, 'Kinh độ không hợp lệ')

export const latitudeNumberSchema = z.coerce
  .number()
  .min(-90, 'Vĩ độ không hợp lệ')
  .max(90, 'Vĩ độ không hợp lệ')
export const longitudeNumberSchema = z.coerce
  .number()
  .min(-180, 'Kinh độ không hợp lệ')
  .max(180, 'Kinh độ không hợp lệ')

// ─── Pagination ────────────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type PaginationInput = z.infer<typeof paginationSchema>

// ─── UUID Param ────────────────────────────────────────
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
})
export type UuidParam = z.infer<typeof uuidParamSchema>

// ─── Slug Param ────────────────────────────────────────
export const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
})
export type SlugParam = z.infer<typeof slugParamSchema>

// ─── Gift Validators ──────────────────────────────────
export const giftByPhoneSchema = z.object({
  recipient_phone: z.string().min(1, 'Số điện thoại không được để trống.'),
  message: z.string().max(200).optional(),
})
export type GiftByPhoneInput = z.infer<typeof giftByPhoneSchema>
