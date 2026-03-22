import { z } from 'zod'

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
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
})
export type SlugParam = z.infer<typeof slugParamSchema>
