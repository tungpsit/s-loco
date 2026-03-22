import { getDb } from '@s-local/db'
import { serviceCategories, services, vendors } from '@s-local/db/schema'
import type { ServiceFilterInput } from '@s-local/shared/validators'
import { and, eq, gte, ilike, isNull, lte, sql } from 'drizzle-orm'

export async function searchServices(filters: ServiceFilterInput) {
  const db = getDb()
  const page = filters.page || 1
  const limit = filters.limit || 20
  const offset = (page - 1) * limit

  const conditions = [isNull(services.deletedAt), eq(services.isActive, true)]

  // Keyword search (Vietnamese-aware with ILIKE)
  if (filters.q) {
    const q = `%${filters.q}%`
    conditions.push(
      sql`(${ilike(services.name, q)} OR ${ilike(services.description, q)} OR ${ilike(vendors.name, q)})`,
    )
  }

  // Category filter
  if (filters.category) {
    conditions.push(eq(serviceCategories.slug, filters.category))
  }

  // Price range
  if (filters.min_price !== undefined) {
    conditions.push(gte(sql`COALESCE(${services.discountPrice}, ${services.originalPrice})::numeric`, filters.min_price))
  }
  if (filters.max_price !== undefined) {
    conditions.push(lte(sql`COALESCE(${services.discountPrice}, ${services.originalPrice})::numeric`, filters.max_price))
  }

  // Rating filter (on vendor)
  if (filters.min_rating !== undefined) {
    conditions.push(gte(sql`${vendors.ratingAvg}::numeric`, filters.min_rating))
  }

  const items = await db
    .select({
      service: services,
      vendor: { id: vendors.id, name: vendors.name, slug: vendors.slug, ratingAvg: vendors.ratingAvg, reviewCount: vendors.reviewCount },
      category: { id: serviceCategories.id, name: serviceCategories.name, slug: serviceCategories.slug, icon: serviceCategories.icon },
    })
    .from(services)
    .innerJoin(vendors, and(eq(services.vendorId, vendors.id), eq(vendors.status, 'active')))
    .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .where(and(...conditions))
    .orderBy(sql`${vendors.ratingAvg}::numeric DESC, ${services.createdAt} DESC`)
    .limit(limit)
    .offset(offset)

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(services)
    .innerJoin(vendors, and(eq(services.vendorId, vendors.id), eq(vendors.status, 'active')))
    .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .where(and(...conditions))

  return { items, total: Number(count), page, limit }
}

export async function listCategories() {
  const db = getDb()
  return db.select().from(serviceCategories)
    .where(eq(serviceCategories.isActive, true))
    .orderBy(sql`${serviceCategories.sortOrder} ASC`)
}

export async function getFeaturedVendors(limit = 10) {
  const db = getDb()
  return db.select().from(vendors)
    .where(and(eq(vendors.status, 'active'), isNull(vendors.deletedAt)))
    .orderBy(sql`${vendors.ratingAvg}::numeric DESC, ${vendors.reviewCount} DESC`)
    .limit(limit)
}
