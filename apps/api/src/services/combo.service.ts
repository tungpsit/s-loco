import { getDb } from '../db'
import { orderItems, orders, services, vendors, vouchers } from '@S-Loco/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { generateVoucherCode } from './voucher.service'

/** Non-null assertion for Drizzle scalar selects */
function scalar<T>(rows: T[]): T {
  return rows[0]!
}

interface ComboItem {
  serviceId: string
  quantity: number
}

export async function createCombo(
  vendorId: string,
  data: {
    name: string
    description?: string
    items: ComboItem[]
    comboPrice: number
    images?: string[]
  },
) {
  const db = getDb()
  for (const item of data.items) {
    const [svc] = await db
      .select()
      .from(services)
      .where(and(eq(services.id, item.serviceId), eq(services.vendorId, vendorId)))
      .limit(1)
    if (!svc)
      throw new ComboError('INVALID_SERVICE', `Dịch vụ ${item.serviceId} không thuộc cửa hàng này.`)
  }
  let originalTotal = 0
  for (const item of data.items) {
    const [svc] = await db.select().from(services).where(eq(services.id, item.serviceId)).limit(1)
    if (svc) originalTotal += Number(svc.originalPrice) * item.quantity
  }
  const [combo] = await db
    .insert(services)
    .values({
      vendorId,
      name: data.name,
      description: data.description,
      originalPrice: String(originalTotal),
      discountPrice: String(data.comboPrice),
      images: data.images || [],
      comboItems: data.items,
      isActive: true,
      maxQuantityPerOrder: 5,
    } as any)
    .returning()
  return combo
}

export async function listCombos(opts: { vendor_id?: string; page?: number; limit?: number }) {
  const db = getDb()
  const page = opts.page || 1
  const limit = opts.limit || 20
  const offset = (page - 1) * limit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svcAny = services as any
  const conditions = [sql`${svcAny.comboItems} IS NOT NULL`, eq(services.isActive, true)]
  if (opts.vendor_id) conditions.push(eq(services.vendorId, opts.vendor_id))
  const items = await db
    .select({ combo: svcAny, vendor: { id: vendors.id, name: vendors.name } } as any)
    .from(services)
    .innerJoin(vendors, eq(services.vendorId, vendors.id))
    .where(and(...conditions))
    .limit(limit)
    .offset(offset)
  const countRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(services)
    .where(and(...conditions))
  return { items, total: Number(scalar(countRows).count), page, limit }
}

export async function purchaseCombo(comboServiceId: string, userId: string, quantity: number) {
  const db = getDb()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svcAny = services as any
  const comboRows = await db
    .select()
    .from(services)
    .where(and(eq(services.id, comboServiceId), sql`${svcAny.comboItems} IS NOT NULL`))
    .limit(1)
  const combo = scalar(comboRows) as any
  const comboItems = combo.comboItems as ComboItem[]
  if (!comboItems?.length) throw new ComboError('INVALID', 'Combo không có dịch vụ.')
  const finalAmount = Number(combo.discountPrice || combo.originalPrice) * quantity

  const result = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        userId,
        totalAmount: String(Number(combo.originalPrice) * quantity),
        discountAmount: String(Number(combo.originalPrice) * quantity - finalAmount),
        finalAmount: String(finalAmount),
        note: `Combo: ${combo.name}`,
      })
      .returning()
    const createdVouchers = []
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    for (let q = 0; q < quantity; q++) {
      for (const item of comboItems) {
        const [svc] = await tx
          .select()
          .from(services)
          .where(eq(services.id, item.serviceId))
          .limit(1)
        if (!svc) continue
        const [orderItem] = await tx
          .insert(orderItems)
          .values({
            orderId: order!.id,
            serviceId: item.serviceId,
            vendorId: svc.vendorId,
            quantity: item.quantity,
            unitPrice: svc.discountPrice || svc.originalPrice,
            totalPrice: String(Number(svc.discountPrice || svc.originalPrice) * item.quantity),
            serviceSnapshot: { name: svc.name, comboName: combo.name },
          })
          .returning()
        for (let i = 0; i < item.quantity; i++) {
          const [voucher] = await tx
            .insert(vouchers)
            .values({
              orderItemId: orderItem!.id,
              userId,
              vendorId: svc.vendorId,
              serviceId: item.serviceId,
              code: generateVoucherCode(),
              status: 'created',
              expiresAt,
            })
            .returning()
          createdVouchers.push(voucher!)
        }
      }
    }
    return { order: order!, vouchers: createdVouchers }
  })
  return result
}

export class ComboError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'ComboError'
  }
}
