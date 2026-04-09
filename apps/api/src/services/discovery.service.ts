import { getDb } from '../db'
import { serviceCategories, services, vendors } from '@S-Loco/db/schema'
import type { ServiceFilterInput } from '@S-Loco/shared/validators'
import { and, desc, eq, gte, ilike, isNull, lte, sql, asc } from 'drizzle-orm'

/** Non-null assertion for Drizzle scalar selects */
function scalar<T>(rows: T[]): T {
  return rows[0]!
}

export async function searchServices(filters: ServiceFilterInput) {
  const db = getDb()
  const page = filters.page || 1
  const limit = filters.limit || 20
  const offset = (page - 1) * limit

  const conditions = [isNull(services.deletedAt), eq(services.isActive, true)]

  // Keyword search — tsvector (GIN) + ILIKE trigram fallback
  // Use unaccent() + plainto_tsquery so "tôm hùm" → "tom hum" matches search_vector
  if (filters.q) {
    const q = filters.q.trim()
    if (q.length > 0) {
      conditions.push(
        sql`(
          services.search_vector @@ plainto_tsquery('simple', unaccent(${q}))
          OR vendors.search_vector @@ plainto_tsquery('simple', unaccent(${q}))
          OR ${ilike(services.name, `%${q}%`)}
          OR ${ilike(services.description, `%${q}%`)}
          OR ${ilike(vendors.name, `%${q}%`)}
        )`,
      )
    }
  }

  // Category filter
  if (filters.category) {
    conditions.push(eq(serviceCategories.slug, filters.category))
  }

  // Price range
  if (filters.min_price !== undefined) {
    conditions.push(
      gte(
        sql`COALESCE(${services.discountPrice}, ${services.originalPrice})::numeric`,
        filters.min_price,
      ),
    )
  }
  if (filters.max_price !== undefined) {
    conditions.push(
      lte(
        sql`COALESCE(${services.discountPrice}, ${services.originalPrice})::numeric`,
        filters.max_price,
      ),
    )
  }

  // Rating filter (on vendor)
  if (filters.min_rating !== undefined) {
    conditions.push(gte(sql`${vendors.ratingAvg}::numeric`, filters.min_rating))
  }

  // Build ORDER BY from sort param
  const effectiveSort = filters.sort ?? 'relevance'
  const priceCol = sql`COALESCE(${services.discountPrice}, ${services.originalPrice})::numeric`
  const orderBy =
    effectiveSort === 'price_asc'
      ? [asc(priceCol), desc(sql`${vendors.ratingAvg}::numeric`)]
      : effectiveSort === 'price_desc'
        ? [desc(priceCol), desc(sql`${vendors.ratingAvg}::numeric`)]
        : effectiveSort === 'rating_desc'
          ? [desc(sql`${vendors.ratingAvg}::numeric`), desc(sql`${vendors.reviewCount}::int`)]
          : effectiveSort === 'newest'
            ? [desc(services.createdAt)]
            : [desc(sql`${vendors.ratingAvg}::numeric`), desc(services.createdAt)] // relevance default

  const items = await db
    .select({
      service: services,
      vendor: {
        id: vendors.id,
        name: vendors.name,
        slug: vendors.slug,
        ratingAvg: vendors.ratingAvg,
        reviewCount: vendors.reviewCount,
      },
      category: {
        id: serviceCategories.id,
        name: serviceCategories.name,
        slug: serviceCategories.slug,
        icon: serviceCategories.icon,
      },
    })
    .from(services)
    .innerJoin(vendors, and(eq(services.vendorId, vendors.id), eq(vendors.status, 'active')))
    .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .where(and(...conditions))
    .orderBy(...orderBy)
    .limit(limit)
    .offset(offset)

  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(services)
    .innerJoin(vendors, and(eq(services.vendorId, vendors.id), eq(vendors.status, 'active')))
    .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .where(and(...conditions))

  return { items, total: Number(scalar(rows).count), page, limit }
}

export async function listCategories() {
  const db = getDb()
  return db
    .select()
    .from(serviceCategories)
    .where(eq(serviceCategories.isActive, true))
    .orderBy(sql`${serviceCategories.sortOrder} ASC`)
}

export async function getFeaturedVendors(limit = 10) {
  const db = getDb()
  return db
    .select()
    .from(vendors)
    .where(and(eq(vendors.status, 'active'), isNull(vendors.deletedAt)))
    .orderBy(sql`${vendors.ratingAvg}::numeric DESC, ${vendors.reviewCount} DESC`)
    .limit(limit)
}
