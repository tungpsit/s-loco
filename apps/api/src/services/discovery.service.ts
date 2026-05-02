import { serviceCategories, services, vendors } from '@S-Loco/db/schema'
import type { ServiceFilterInput } from '@S-Loco/shared/validators'
import { and, asc, desc, eq, gte, ilike, isNull, lte, sql } from 'drizzle-orm'
import { getDb } from '../db'
import { withServicePricing } from './pricing'

/** Non-null assertion for Drizzle scalar selects */
function scalar<T>(rows: T[]): T {
  return rows[0]!
}

export async function searchServices(filters: ServiceFilterInput) {
  const db = getDb()
  const page = filters.page || 1
  const limit = filters.limit || 20
  const offset = (page - 1) * limit
  const hasOrigin = filters.origin_latitude !== undefined && filters.origin_longitude !== undefined
  const dynamicDistanceCol = hasOrigin
    ? sql<number>`CASE
        WHEN ${vendors.latitude} IS NULL OR ${vendors.longitude} IS NULL THEN NULL
        ELSE ROUND((
          6371 * 2 * ASIN(SQRT(
            POWER(SIN(RADIANS((${vendors.latitude}::numeric - ${filters.origin_latitude}) / 2)), 2)
            + COS(RADIANS(${filters.origin_latitude}))
            * COS(RADIANS(${vendors.latitude}::numeric))
            * POWER(SIN(RADIANS((${vendors.longitude}::numeric - ${filters.origin_longitude}) / 2)), 2)
          ))
        )::numeric, 1)
      END`
    : undefined
  const selectedDistanceFromOriginKm = dynamicDistanceCol ?? sql<number>`NULL`
  const distanceCol = dynamicDistanceCol ?? sql`${vendors.distanceKm}::numeric`

  const conditions = [isNull(services.deletedAt), eq(services.isActive, true)]
  const finalPriceCol = sql`(
    COALESCE(${services.discountPrice}, ${services.originalPrice})::numeric
    * (1 - (${vendors.appDiscountPercent}::numeric / 100))
  )`

  // Keyword search — local-safe ILIKE fallback
  if (filters.q) {
    const q = filters.q.trim()
    if (q.length > 0) {
      conditions.push(
        sql`(
          ${ilike(services.name, `%${q}%`)}
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
    conditions.push(gte(finalPriceCol, filters.min_price))
  }
  if (filters.max_price !== undefined) {
    conditions.push(lte(finalPriceCol, filters.max_price))
  }

  // Distance filter (km from Tây An beach)
  if (filters.min_distance !== undefined) {
    conditions.push(gte(distanceCol, filters.min_distance))
  }
  if (filters.max_distance !== undefined) {
    conditions.push(lte(distanceCol, filters.max_distance))
  }

  // Rating filter (on vendor)
  if (filters.min_rating !== undefined) {
    conditions.push(
      gte(
        sql`COALESCE(${services.averageRating}, ${vendors.ratingAvg})::numeric`,
        filters.min_rating,
      ),
    )
  }

  // Build ORDER BY from sort param
  const effectiveSort = filters.sort ?? 'relevance'
  const priceCol = finalPriceCol
  const orderBy =
    effectiveSort === 'price_asc'
      ? [asc(priceCol), desc(sql`${vendors.ratingAvg}::numeric`)]
      : effectiveSort === 'price_desc'
        ? [desc(priceCol), desc(sql`${vendors.ratingAvg}::numeric`)]
        : effectiveSort === 'rating_desc'
          ? [
              desc(sql`${vendors.ratingAvg}::numeric`),
              desc(sql`${services.averageRating}::numeric`),
              desc(sql`${vendors.reviewCount}::int`),
            ]
          : effectiveSort === 'newest'
            ? [desc(services.createdAt)]
            : effectiveSort === 'distance_asc'
              ? [asc(sql`COALESCE(${distanceCol}, 9999)::numeric`)]
              : [desc(sql`${vendors.ratingAvg}::numeric`), desc(services.createdAt)] // relevance default

  const items = await db
    .select({
      service: {
        ...services,
        averageRating: services.averageRating,
      },
      vendor: {
        id: vendors.id,
        name: vendors.name,
        slug: vendors.slug,
        ratingAvg: vendors.ratingAvg,
        reviewCount: vendors.reviewCount,
        distanceKm: vendors.distanceKm,
        address: vendors.address,
        latitude: vendors.latitude,
        longitude: vendors.longitude,
        commissionRate: vendors.commissionRate,
        appDiscountPercent: vendors.appDiscountPercent,
      },
      distanceFromOriginKm: selectedDistanceFromOriginKm,
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

  return {
    items: items.map((item) =>
      withServicePricing(item as Parameters<typeof withServicePricing>[0]),
    ),
    total: Number(scalar(rows).count),
    page,
    limit,
  }
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
