import { getDb } from '@S-Loco/db'
import { vendors } from '@S-Loco/db/schema'
import type { AdminUpdateVendorInput, CreateVendorInput, UpdateVendorInput, UpdateVendorStatusInput } from '@S-Loco/shared/validators'
import { and, eq, isNull, sql } from 'drizzle-orm'

export async function createVendor(data: CreateVendorInput) {
  const db = getDb()
  const [vendor] = await db.insert(vendors).values({
    ownerId: data.owner_id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    address: data.address,
    latitude: data.latitude,
    longitude: data.longitude,
    phone: data.phone,
    email: data.email,
    commissionRate: data.commission_rate || '8.00',
    businessHours: data.business_hours,
  }).returning()
  return vendor!
}

export async function updateVendorStatus(vendorId: string, input: UpdateVendorStatusInput) {
  const db = getDb()
  const [updated] = await db.update(vendors)
    .set({ status: input.status, updatedAt: new Date() })
    .where(eq(vendors.id, vendorId))
    .returning()
  if (!updated) throw new VendorError('NOT_FOUND', 'Cửa hàng không tồn tại.')
  return updated
}

export async function getVendorBySlug(slug: string) {
  const db = getDb()
  const [vendor] = await db.select().from(vendors)
    .where(and(eq(vendors.slug, slug), isNull(vendors.deletedAt)))
    .limit(1)
  if (!vendor) throw new VendorError('NOT_FOUND', 'Cửa hàng không tồn tại.')
  return vendor
}

export async function getVendorById(vendorId: string) {
  const db = getDb()
  const [vendor] = await db.select().from(vendors)
    .where(and(eq(vendors.id, vendorId), isNull(vendors.deletedAt)))
    .limit(1)
  if (!vendor) throw new VendorError('NOT_FOUND', 'Cửa hàng không tồn tại.')
  return vendor
}

export async function listVendors(opts: { status?: string; page?: number; limit?: number }) {
  const db = getDb()
  const page = opts.page || 1
  const limit = opts.limit || 20
  const offset = (page - 1) * limit

  const conditions = [isNull(vendors.deletedAt)]
  if (opts.status) conditions.push(eq(vendors.status, opts.status as any))

  const items = await db.select().from(vendors)
    .where(and(...conditions))
    .orderBy(sql`${vendors.createdAt} DESC`)
    .limit(limit)
    .offset(offset)

  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(vendors)
    .where(and(...conditions))

  return { items, total: Number(count), page, limit }
}

export async function updateVendor(vendorId: string, ownerId: string, data: UpdateVendorInput) {
  const db = getDb()
  // Check ownership
  const [vendor] = await db.select().from(vendors)
    .where(and(eq(vendors.id, vendorId), eq(vendors.ownerId, ownerId)))
    .limit(1)
  if (!vendor) throw new VendorError('FORBIDDEN', 'Bạn không có quyền chỉnh sửa cửa hàng này.')

  const [updated] = await db.update(vendors)
    .set({
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.latitude !== undefined && { latitude: data.latitude }),
      ...(data.longitude !== undefined && { longitude: data.longitude }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.business_hours !== undefined && { businessHours: data.business_hours }),
      updatedAt: new Date(),
    })
    .where(eq(vendors.id, vendorId))
    .returning()
  return updated!
}

export async function adminUpdateVendor(vendorId: string, data: AdminUpdateVendorInput) {
  const db = getDb()
  const [vendor] = await db.select().from(vendors)
    .where(eq(vendors.id, vendorId))
    .limit(1)
  if (!vendor) throw new VendorError('NOT_FOUND', 'Cửa hàng không tồn tại.')

  const [updated] = await db.update(vendors)
    .set({
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.latitude !== undefined && { latitude: data.latitude }),
      ...(data.longitude !== undefined && { longitude: data.longitude }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.business_hours !== undefined && { businessHours: data.business_hours }),
      ...(data.commission_rate !== undefined && { commissionRate: data.commission_rate }),
      updatedAt: new Date(),
    })
    .where(eq(vendors.id, vendorId))
    .returning()
  return updated!
}

export async function getVendorByOwnerId(ownerId: string) {
  const db = getDb()
  const items = await db.select().from(vendors)
    .where(and(eq(vendors.ownerId, ownerId), isNull(vendors.deletedAt)))
  return items
}

export class VendorError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'VendorError'
  }
}
