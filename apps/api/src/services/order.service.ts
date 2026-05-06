import { orderItems, orders, services, vendors, vouchers } from '@S-Loco/db/schema'
import type { CreateOrderInput } from '@S-Loco/shared/validators'
import { and, eq, sql } from 'drizzle-orm'
import { getDb } from '../db'
import { notifyOrderPaid } from './notification.service'
import { calculateServicePricing } from './pricing'
import { artifactTypeForProductType, normalizeProductType } from './product-types'
import { generateQrToken, generateVoucherCode } from './voucher.service'

/** Non-null assertion for Drizzle scalar selects */
function scalar<T>(rows: T[]): T {
  return rows[0]!
}

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase()
  return `SL-${date}-${suffix}`
}

export async function createOrder(userId: string, input: CreateOrderInput) {
  const db = getDb()

  // 1. Fetch all services and validate
  const serviceIds = input.items.map((i) => i.service_id)
  const serviceRows = await db
    .select({ service: services, vendor: vendors })
    .from(services)
    .innerJoin(vendors, eq(services.vendorId, vendors.id))
    .where(
      and(
        eq(services.isActive, true),
        sql`${services.id} = ANY(ARRAY[${sql.join(
          serviceIds.map((id) => sql`${id}::uuid`),
          sql`, `,
        )}])`,
      ),
    )

  const serviceMap = new Map(serviceRows.map((row) => [row.service.id, row]))

  // Validate all services exist and are active
  for (const item of input.items) {
    const svc = serviceMap.get(item.service_id)
    if (!svc)
      throw new OrderError(
        'SERVICE_NOT_FOUND',
        `Dịch vụ ${item.service_id} không tồn tại hoặc đã ngừng hoạt động.`,
      )
    const productType = normalizeProductType({
      productType: svc.service.productType,
      fulfillmentType: svc.service.fulfillmentType,
    })
    if (productType === 'coupon') {
      throw new OrderError(
        'COUPON_NOT_PREPAID',
        `"${svc.service.name}" là mã giảm giá, vui lòng nhận mã thay vì thanh toán đơn hàng.`,
      )
    }
    if (item.quantity > svc.service.maxQuantityPerOrder) {
      throw new OrderError(
        'QUANTITY_EXCEEDED',
        `Số lượng tối đa cho "${svc.service.name}" là ${svc.service.maxQuantityPerOrder}.`,
      )
    }
  }

  // 2. Calculate totals
  let totalAmount = 0
  let discountAmount = 0
  const itemsData: Array<{
    serviceId: string
    vendorId: string
    quantity: number
    unitPrice: string
    totalPrice: string
    serviceSnapshot: object
    artifactType: 'voucher' | 'ticket'
  }> = []

  for (const item of input.items) {
    const row = serviceMap.get(item.service_id)!
    const svc = row.service
    const productType = normalizeProductType({
      productType: svc.productType,
      fulfillmentType: svc.fulfillmentType,
    })
    const artifactType = artifactTypeForProductType(productType)
    if (!artifactType) {
      throw new OrderError('COUPON_NOT_PREPAID', `"${svc.name}" là mã giảm giá, không thể thanh toán trước.`)
    }
    const pricing = calculateServicePricing({
      originalPrice: svc.originalPrice,
      discountPrice: svc.discountPrice,
      discountPercent: svc.discountPercent,
      commissionRate: row.vendor.commissionRate,
      appDiscountPercent: row.vendor.appDiscountPercent,
    })
    const price = Number(pricing.final_price)
    const originalTotal = Number(pricing.original_price) * item.quantity
    const itemTotal = price * item.quantity
    totalAmount += originalTotal
    discountAmount += originalTotal - itemTotal

    itemsData.push({
      serviceId: svc.id,
      vendorId: svc.vendorId,
      quantity: item.quantity,
      unitPrice: String(price),
      totalPrice: String(itemTotal),
      serviceSnapshot: {
        name: svc.name,
        originalPrice: svc.originalPrice,
        discountPrice: svc.discountPrice,
        productType,
        artifactType,
        pricing,
        images: svc.images,
      },
      artifactType,
    })
  }

  const finalAmount = totalAmount - discountAmount

  // 3. Create order, items, and vouchers in transaction
  const result = await db.transaction(async (tx) => {
    // Create order
    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber: generateOrderNumber(),
        userId,
        totalAmount: String(totalAmount),
        discountAmount: String(discountAmount),
        finalAmount: String(finalAmount),
        note: input.note,
      })
      .returning()

    // Create order items
    const createdItems = []
    for (const item of itemsData) {
      const [orderItem] = await tx
        .insert(orderItems)
        .values({
          orderId: order!.id,
          serviceId: item.serviceId,
          vendorId: item.vendorId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          serviceSnapshot: item.serviceSnapshot,
        })
        .returning()
      createdItems.push(orderItem!)
    }

    // Create vouchers (one per item × quantity)
    const createdVouchers = []
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    for (const orderItem of createdItems) {
      const sourceItem = itemsData.find(
        (item) => item.serviceId === orderItem.serviceId && item.vendorId === orderItem.vendorId,
      )
      for (let i = 0; i < orderItem.quantity; i++) {
        const code = generateVoucherCode()
        const [voucher] = await tx
          .insert(vouchers)
          .values({
            orderItemId: orderItem.id,
            userId,
            vendorId: orderItem.vendorId,
            serviceId: orderItem.serviceId,
            code,
            artifactType: sourceItem?.artifactType ?? 'voucher',
            status: 'created',
            expiresAt,
          })
          .returning()
        createdVouchers.push(voucher!)
      }
    }

    return { order: order!, items: createdItems, vouchers: createdVouchers }
  })

  return result
}

export async function mockPayOrder(orderId: string, userId: string) {
  const db = getDb()

  // Verify ownership and status
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId), eq(orders.status, 'created')))
    .limit(1)
  if (!order) throw new OrderError('NOT_FOUND', 'Đơn hàng không tồn tại hoặc đã được thanh toán.')

  await db.transaction(async (tx) => {
    // Mark order as paid
    await tx
      .update(orders)
      .set({ status: 'paid', updatedAt: new Date() })
      .where(eq(orders.id, orderId))

    // Mark all vouchers as paid and generate QR tokens
    const orderVouchers = await tx
      .select()
      .from(vouchers)
      .where(
        eq(vouchers.orderItemId, sql`ANY(SELECT id FROM order_items WHERE order_id = ${orderId})`),
      )

    // Simpler approach: update by user + order vouchers
    const voucherRows = await tx
      .select({ id: vouchers.id, expiresAt: vouchers.expiresAt })
      .from(vouchers)
      .innerJoin(orderItems, eq(vouchers.orderItemId, orderItems.id))
      .where(and(eq(orderItems.orderId, orderId), eq(vouchers.status, 'created')))

    for (const v of voucherRows) {
      const qrToken = await generateQrToken(v.id, v.expiresAt)
      await tx
        .update(vouchers)
        .set({ status: 'paid', qrToken, updatedAt: new Date() })
        .where(eq(vouchers.id, v.id))
    }
  })

  void notifyOrderPaid(orderId).catch((err) => {
    console.error(`[Notification] Failed to notify paid order ${orderId}:`, err)
  })

  return { success: true, message: 'Đơn hàng đã được thanh toán (mock).' }
}

export async function cancelOrder(orderId: string, userId: string) {
  const db = getDb()

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId), eq(orders.status, 'created')))
    .limit(1)
  if (!order) throw new OrderError('NOT_FOUND', 'Đơn hàng không tồn tại hoặc không thể hủy.')

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(orders.id, orderId))

    // Cancel all vouchers
    await tx
      .update(vouchers)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(
        sql`${vouchers.orderItemId} IN (SELECT id FROM order_items WHERE order_id = ${orderId})`,
      )
  })

  return { success: true }
}

export async function listOrders(
  userId: string,
  opts: { page?: number; limit?: number; status?: string },
) {
  const db = getDb()
  const page = opts.page || 1
  const limit = opts.limit || 20
  const offset = (page - 1) * limit

  const conditions = [eq(orders.userId, userId)]
  if (opts.status) conditions.push(eq(orders.status, opts.status as any))

  const items = await db
    .select()
    .from(orders)
    .where(and(...conditions))
    .orderBy(sql`${orders.createdAt} DESC`)
    .limit(limit)
    .offset(offset)

  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(and(...conditions))

  return { items, total: Number(scalar(rows).count), page, limit }
}

export async function getOrderDetail(orderId: string, userId: string) {
  const db = getDb()

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1)
  if (!order) throw new OrderError('NOT_FOUND', 'Đơn hàng không tồn tại.')

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId))
  const voucherRows = await db
    .select()
    .from(vouchers)
    .where(sql`${vouchers.orderItemId} IN (SELECT id FROM order_items WHERE order_id = ${orderId})`)

  return { order, items, vouchers: voucherRows }
}

export class OrderError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'OrderError'
  }
}
