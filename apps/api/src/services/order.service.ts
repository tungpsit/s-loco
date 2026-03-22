import { getDb } from '@s-local/db'
import { orderItems, orders, services, vouchers } from '@s-local/db/schema'
import type { CreateOrderInput } from '@s-local/shared/validators'
import { and, eq, sql } from 'drizzle-orm'
import { generateQrToken, generateVoucherCode } from './voucher.service'

export async function createOrder(userId: string, input: CreateOrderInput) {
  const db = getDb()

  // 1. Fetch all services and validate
  const serviceIds = input.items.map((i) => i.service_id)
  const serviceRows = await db.select().from(services)
    .where(and(eq(services.isActive, true), sql`${services.id} = ANY(ARRAY[${sql.join(serviceIds.map(id => sql`${id}::uuid`), sql`, `)}])`))

  const serviceMap = new Map(serviceRows.map((s) => [s.id, s]))

  // Validate all services exist and are active
  for (const item of input.items) {
    const svc = serviceMap.get(item.service_id)
    if (!svc) throw new OrderError('SERVICE_NOT_FOUND', `Dịch vụ ${item.service_id} không tồn tại hoặc đã ngừng hoạt động.`)
    if (item.quantity > svc.maxQuantityPerOrder) {
      throw new OrderError('QUANTITY_EXCEEDED', `Số lượng tối đa cho "${svc.name}" là ${svc.maxQuantityPerOrder}.`)
    }
  }

  // 2. Calculate totals
  let totalAmount = 0
  let discountAmount = 0
  const itemsData: Array<{
    serviceId: string; vendorId: string; quantity: number
    unitPrice: string; totalPrice: string; serviceSnapshot: object
  }> = []

  for (const item of input.items) {
    const svc = serviceMap.get(item.service_id)!
    const price = svc.discountPrice ? Number(svc.discountPrice) : Number(svc.originalPrice)
    const originalTotal = Number(svc.originalPrice) * item.quantity
    const itemTotal = price * item.quantity
    totalAmount += originalTotal
    discountAmount += originalTotal - itemTotal

    itemsData.push({
      serviceId: svc.id,
      vendorId: svc.vendorId,
      quantity: item.quantity,
      unitPrice: String(price),
      totalPrice: String(itemTotal),
      serviceSnapshot: { name: svc.name, originalPrice: svc.originalPrice, discountPrice: svc.discountPrice, images: svc.images },
    })
  }

  const finalAmount = totalAmount - discountAmount

  // 3. Create order, items, and vouchers in transaction
  const result = await db.transaction(async (tx) => {
    // Create order
    const [order] = await tx.insert(orders).values({
      userId,
      totalAmount: String(totalAmount),
      discountAmount: String(discountAmount),
      finalAmount: String(finalAmount),
      note: input.note,
    }).returning()

    // Create order items
    const createdItems = []
    for (const item of itemsData) {
      const [orderItem] = await tx.insert(orderItems).values({
        orderId: order!.id,
        serviceId: item.serviceId,
        vendorId: item.vendorId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        serviceSnapshot: item.serviceSnapshot,
      }).returning()
      createdItems.push(orderItem!)
    }

    // Create vouchers (one per item × quantity)
    const createdVouchers = []
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    for (const orderItem of createdItems) {
      for (let i = 0; i < orderItem.quantity; i++) {
        const code = generateVoucherCode()
        const [voucher] = await tx.insert(vouchers).values({
          orderItemId: orderItem.id,
          userId,
          vendorId: orderItem.vendorId,
          serviceId: orderItem.serviceId,
          code,
          status: 'created',
          expiresAt,
        }).returning()
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
  const [order] = await db.select().from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId), eq(orders.status, 'created')))
    .limit(1)
  if (!order) throw new OrderError('NOT_FOUND', 'Đơn hàng không tồn tại hoặc đã được thanh toán.')

  await db.transaction(async (tx) => {
    // Mark order as paid
    await tx.update(orders)
      .set({ status: 'paid', updatedAt: new Date() })
      .where(eq(orders.id, orderId))

    // Mark all vouchers as paid and generate QR tokens
    const orderVouchers = await tx.select().from(vouchers)
      .where(eq(vouchers.orderItemId, sql`ANY(SELECT id FROM order_items WHERE order_id = ${orderId})`))

    // Simpler approach: update by user + order vouchers
    const voucherRows = await tx.select({ id: vouchers.id, expiresAt: vouchers.expiresAt })
      .from(vouchers)
      .innerJoin(orderItems, eq(vouchers.orderItemId, orderItems.id))
      .where(and(eq(orderItems.orderId, orderId), eq(vouchers.status, 'created')))

    for (const v of voucherRows) {
      const qrToken = await generateQrToken(v.id, v.expiresAt)
      await tx.update(vouchers)
        .set({ status: 'paid', qrToken, updatedAt: new Date() })
        .where(eq(vouchers.id, v.id))
    }
  })

  return { success: true, message: 'Đơn hàng đã được thanh toán (mock).' }
}

export async function cancelOrder(orderId: string, userId: string) {
  const db = getDb()

  const [order] = await db.select().from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId), eq(orders.status, 'created')))
    .limit(1)
  if (!order) throw new OrderError('NOT_FOUND', 'Đơn hàng không tồn tại hoặc không thể hủy.')

  await db.transaction(async (tx) => {
    await tx.update(orders)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(orders.id, orderId))

    // Cancel all vouchers
    await tx.update(vouchers)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(sql`${vouchers.orderItemId} IN (SELECT id FROM order_items WHERE order_id = ${orderId})`)
  })

  return { success: true }
}

export async function listOrders(userId: string, opts: { page?: number; limit?: number; status?: string }) {
  const db = getDb()
  const page = opts.page || 1
  const limit = opts.limit || 20
  const offset = (page - 1) * limit

  const conditions = [eq(orders.userId, userId)]
  if (opts.status) conditions.push(eq(orders.status, opts.status as any))

  const items = await db.select().from(orders)
    .where(and(...conditions))
    .orderBy(sql`${orders.createdAt} DESC`)
    .limit(limit)
    .offset(offset)

  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(and(...conditions))

  return { items, total: Number(count), page, limit }
}

export async function getOrderDetail(orderId: string, userId: string) {
  const db = getDb()

  const [order] = await db.select().from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1)
  if (!order) throw new OrderError('NOT_FOUND', 'Đơn hàng không tồn tại.')

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId))
  const voucherRows = await db.select().from(vouchers)
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
