import { serviceCategories, services, vendors } from '@S-Loco/db/schema'
import type { CreateServiceInput, UpdateServiceInput } from '@S-Loco/shared/validators'
import type { InferInsertModel } from 'drizzle-orm'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { getDb } from '../db'
import { withServicePricing } from './pricing'

type ServiceUpdateData = Partial<InferInsertModel<typeof services>>

export async function createService(vendorId: string, ownerId: string, data: CreateServiceInput) {
  const db = getDb()
  // Verify vendor ownership
  const [vendor] = await db
    .select()
    .from(vendors)
    .where(and(eq(vendors.id, vendorId), eq(vendors.ownerId, ownerId)))
    .limit(1)
  if (!vendor)
    throw new ServiceError('FORBIDDEN', 'Bạn không có quyền thêm dịch vụ cho cửa hàng này.')

  const [service] = await db
    .insert(services)
    .values({
      vendorId,
      categoryId: data.category_id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      originalPrice: data.original_price,
      discountPrice: data.discount_price,
      discountPercent: data.discount_percent,
      productType: data.product_type,
      fulfillmentType: data.fulfillment_type,
      reservationDiscountPercent: data.reservation_discount_percent,
      durationMinutes: data.duration_minutes,
      maxQuantityPerOrder: data.max_quantity_per_order || 10,
      images: data.images || [],
      options: data.options,
    })
    .returning()
  return service!
}

export async function adminCreateService(vendorId: string, data: CreateServiceInput) {
  const db = getDb()
  const [vendor] = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1)
  if (!vendor) throw new ServiceError('NOT_FOUND', 'Cửa hàng không tồn tại.')

  const [service] = await db
    .insert(services)
    .values({
      vendorId,
      categoryId: data.category_id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      originalPrice: data.original_price,
      discountPrice: data.discount_price,
      discountPercent: data.discount_percent,
      productType: data.product_type,
      fulfillmentType: data.fulfillment_type,
      reservationDiscountPercent: data.reservation_discount_percent,
      durationMinutes: data.duration_minutes,
      maxQuantityPerOrder: data.max_quantity_per_order || 10,
      images: data.images || [],
      options: data.options,
    })
    .returning()
  return service!
}

export async function updateService(serviceId: string, ownerId: string, data: UpdateServiceInput) {
  const db = getDb()
  // Verify ownership through vendor
  const [svc] = await db
    .select({ service: services, vendor: vendors })
    .from(services)
    .innerJoin(vendors, eq(services.vendorId, vendors.id))
    .where(and(eq(services.id, serviceId), eq(vendors.ownerId, ownerId)))
    .limit(1)
  if (!svc) throw new ServiceError('FORBIDDEN', 'Bạn không có quyền chỉnh sửa dịch vụ này.')

  const updateData: ServiceUpdateData = { updatedAt: new Date() }
  if (data.name !== undefined) updateData.name = data.name
  if (data.category_id !== undefined) updateData.categoryId = data.category_id
  if (data.description !== undefined) updateData.description = data.description
  if (data.original_price !== undefined) updateData.originalPrice = data.original_price
  if (data.discount_price !== undefined) updateData.discountPrice = data.discount_price
  if (data.discount_percent !== undefined) updateData.discountPercent = data.discount_percent
  if (data.product_type !== undefined) updateData.productType = data.product_type
  if (data.fulfillment_type !== undefined) updateData.fulfillmentType = data.fulfillment_type
  if (data.reservation_discount_percent !== undefined)
    updateData.reservationDiscountPercent = data.reservation_discount_percent
  if (data.duration_minutes !== undefined) updateData.durationMinutes = data.duration_minutes
  if (data.max_quantity_per_order !== undefined)
    updateData.maxQuantityPerOrder = data.max_quantity_per_order
  if (data.images !== undefined) updateData.images = data.images
  if (data.options !== undefined) updateData.options = data.options
  if (data.is_active !== undefined) updateData.isActive = data.is_active
  if (data.sort_order !== undefined) updateData.sortOrder = data.sort_order

  const [updated] = await db
    .update(services)
    .set(updateData)
    .where(eq(services.id, serviceId))
    .returning()
  return updated!
}

export async function adminUpdateService(serviceId: string, data: UpdateServiceInput) {
  const db = getDb()
  const [svc] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1)
  if (!svc) throw new ServiceError('NOT_FOUND', 'Dịch vụ không tồn tại.')

  const updateData: ServiceUpdateData = { updatedAt: new Date() }
  if (data.name !== undefined) updateData.name = data.name
  if (data.category_id !== undefined) updateData.categoryId = data.category_id
  if (data.description !== undefined) updateData.description = data.description
  if (data.original_price !== undefined) updateData.originalPrice = data.original_price
  if (data.discount_price !== undefined) updateData.discountPrice = data.discount_price
  if (data.discount_percent !== undefined) updateData.discountPercent = data.discount_percent
  if (data.product_type !== undefined) updateData.productType = data.product_type
  if (data.fulfillment_type !== undefined) updateData.fulfillmentType = data.fulfillment_type
  if (data.reservation_discount_percent !== undefined)
    updateData.reservationDiscountPercent = data.reservation_discount_percent
  if (data.duration_minutes !== undefined) updateData.durationMinutes = data.duration_minutes
  if (data.max_quantity_per_order !== undefined)
    updateData.maxQuantityPerOrder = data.max_quantity_per_order
  if (data.images !== undefined) updateData.images = data.images
  if (data.options !== undefined) updateData.options = data.options
  if (data.is_active !== undefined) updateData.isActive = data.is_active
  if (data.sort_order !== undefined) updateData.sortOrder = data.sort_order

  const [updated] = await db
    .update(services)
    .set(updateData)
    .where(eq(services.id, serviceId))
    .returning()
  return updated!
}

export async function deleteService(serviceId: string, ownerId: string) {
  const db = getDb()
  // Verify ownership
  const [svc] = await db
    .select({ service: services, vendor: vendors })
    .from(services)
    .innerJoin(vendors, eq(services.vendorId, vendors.id))
    .where(and(eq(services.id, serviceId), eq(vendors.ownerId, ownerId)))
    .limit(1)
  if (!svc) throw new ServiceError('FORBIDDEN', 'Bạn không có quyền xóa dịch vụ này.')

  // Soft delete
  await db
    .update(services)
    .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
    .where(eq(services.id, serviceId))
}

export async function adminDeleteService(serviceId: string) {
  const db = getDb()
  const [svc] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1)
  if (!svc) throw new ServiceError('NOT_FOUND', 'Dịch vụ không tồn tại.')

  await db
    .update(services)
    .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
    .where(eq(services.id, serviceId))
}

export async function listServicesByVendor(vendorId: string) {
  const db = getDb()
  return db
    .select()
    .from(services)
    .where(and(eq(services.vendorId, vendorId), isNull(services.deletedAt)))
    .orderBy(sql`${services.sortOrder} ASC, ${services.createdAt} DESC`)
}

export async function getServiceById(serviceId: string) {
  const db = getDb()
  const [svc] = await db
    .select({ service: services, vendor: vendors, category: serviceCategories })
    .from(services)
    .innerJoin(vendors, eq(services.vendorId, vendors.id))
    .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .where(and(eq(services.id, serviceId), isNull(services.deletedAt)))
    .limit(1)
  if (!svc) throw new ServiceError('NOT_FOUND', 'Dịch vụ không tồn tại.')
  return withServicePricing(svc)
}

export class ServiceError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'ServiceError'
  }
}
