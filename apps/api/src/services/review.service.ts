import { getDb } from '@s-local/db';
import { reviews, services, vendors, vouchers } from '@s-local/db/schema';
import { and, eq, sql } from 'drizzle-orm';

// ─── Create review (COMPLETED voucher required) ────────
export async function createReview(userId: string, data: {
  vendorId: string; serviceId?: string; voucherId?: string
  rating: number; comment?: string
}) {
  const db = getDb()

  // Validate rating range
  if (data.rating < 1 || data.rating > 5) {
    throw new ReviewError('INVALID_RATING', 'Đánh giá phải từ 1 đến 5 sao.')
  }

  // If voucherId provided, verify it's COMPLETED and belongs to user
  if (data.voucherId) {
    const [v] = await db.select().from(vouchers)
      .where(and(eq(vouchers.id, data.voucherId), eq(vouchers.userId, userId)))
      .limit(1)
    if (!v) throw new ReviewError('NOT_FOUND', 'Voucher không tồn tại.')
    if (v.status !== 'completed' && v.status !== 'settled') {
      throw new ReviewError('NOT_COMPLETED', 'Chỉ có thể đánh giá sau khi sử dụng voucher.')
    }
  }

  // Check for duplicate review
  if (data.voucherId) {
    const [existing] = await db.select().from(reviews)
      .where(and(eq(reviews.userId, userId), eq(reviews.voucherId, data.voucherId)))
      .limit(1)
    if (existing) throw new ReviewError('DUPLICATE', 'Bạn đã đánh giá voucher này rồi.')
  }

  // Create review
  const [review] = await db.insert(reviews).values({
    userId,
    vendorId: data.vendorId,
    serviceId: data.serviceId || null,
    voucherId: data.voucherId || null,
    rating: data.rating,
    comment: data.comment,
  }).returning()

  // Update vendor average rating
  await updateVendorRating(data.vendorId)
  if (data.serviceId) await updateServiceRating(data.serviceId)

  return review!
}

// ─── List reviews by vendor ────────────────────────────
export async function listReviewsByVendor(vendorId: string, opts: { page?: number; limit?: number }) {
  const db = getDb()
  const page = opts.page || 1
  const limit = opts.limit || 20
  const offset = (page - 1) * limit

  const items = await db.select().from(reviews)
    .where(and(eq(reviews.vendorId, vendorId), eq(reviews.isVisible, true)))
    .orderBy(sql`${reviews.createdAt} DESC`)
    .limit(limit)
    .offset(offset)

  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(reviews)
    .where(and(eq(reviews.vendorId, vendorId), eq(reviews.isVisible, true)))

  // Average
  const [{ avg }] = await db.select({ avg: sql<string>`ROUND(AVG(${reviews.rating}), 1)` })
    .from(reviews)
    .where(and(eq(reviews.vendorId, vendorId), eq(reviews.isVisible, true)))

  return { items, total: Number(count), average: avg, page, limit }
}

// ─── Admin: moderate review ────────────────────────────
export async function moderateReview(reviewId: string, action: 'hide' | 'show' | 'delete') {
  const db = getDb()

  if (action === 'delete') {
    const [deleted] = await db.delete(reviews).where(eq(reviews.id, reviewId)).returning()
    if (!deleted) throw new ReviewError('NOT_FOUND', 'Đánh giá không tồn tại.')
    await updateVendorRating(deleted.vendorId)
    return { success: true, action: 'deleted' }
  }

  const [updated] = await db.update(reviews)
    .set({ isVisible: action === 'show', updatedAt: new Date() })
    .where(eq(reviews.id, reviewId))
    .returning()
  if (!updated) throw new ReviewError('NOT_FOUND', 'Đánh giá không tồn tại.')
  await updateVendorRating(updated.vendorId)
  return { success: true, action }
}

// ─── Update vendor average rating ──────────────────────
async function updateVendorRating(vendorId: string) {
  const db = getDb()
  const [stats] = await db.select({
    avg: sql<string>`ROUND(AVG(${reviews.rating}), 1)`,
    count: sql<number>`count(*)`,
  })
    .from(reviews)
    .where(and(eq(reviews.vendorId, vendorId), eq(reviews.isVisible, true)))

  await db.update(vendors)
    .set({ averageRating: stats.avg || '0', reviewCount: Number(stats.count), updatedAt: new Date() })
    .where(eq(vendors.id, vendorId))
}

// ─── Update service average rating ─────────────────────
async function updateServiceRating(serviceId: string) {
  const db = getDb()
  const [stats] = await db.select({
    avg: sql<string>`ROUND(AVG(${reviews.rating}), 1)`,
  })
    .from(reviews)
    .where(and(eq(reviews.serviceId, serviceId), eq(reviews.isVisible, true)))

  await db.update(services)
    .set({ averageRating: stats.avg || '0', updatedAt: new Date() })
    .where(eq(services.id, serviceId))
}

export class ReviewError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'ReviewError'
  }
}
