import { orderItems, services, users, vendors, vouchers } from '@S-Loco/db/schema'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { jwtVerify, SignJWT } from 'jose'
import { getDb } from '../db'
import { normalizeProductType } from './product-types'

type VoucherStatus = typeof vouchers.$inferSelect.status

/** Non-null assertion for Drizzle scalar selects */
function scalar<T>(rows: T[]): T {
  return rows[0]!
}

const QR_SECRET = process.env.QR_SECRET
if (!QR_SECRET) {
  throw new Error('FATAL: QR_SECRET env var is required. Set it before starting the server.')
}
if (QR_SECRET.length < 32) {
  throw new Error('FATAL: QR_SECRET must be at least 32 characters.')
}
const _qrSecretBuffer = new TextEncoder().encode(QR_SECRET)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// ─── Generate unique voucher code ──────────────────────
export function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I ambiguity
  let code = ''
  for (let i = 0; i < 12; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// ─── Generate signed QR JWT ────────────────────────────
export async function generateQrToken(voucherId: string, expiresAt: Date): Promise<string> {
  return new SignJWT({ voucher_id: voucherId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(_qrSecretBuffer)
}

// ─── Verify QR JWT ─────────────────────────────────────
export async function verifyQrToken(token: string): Promise<{ voucherId: string }> {
  try {
    const { payload } = await jwtVerify(token, _qrSecretBuffer)
    return { voucherId: payload.voucher_id as string }
  } catch {
    throw new VoucherError('INVALID_QR', 'Mã QR không hợp lệ hoặc đã hết hạn.')
  }
}

// ─── List user's vouchers ──────────────────────────────
export async function listVouchersByUser(
  userId: string,
  opts: { status?: string; page?: number; limit?: number },
) {
  const db = getDb()
  const page = opts.page || 1
  const limit = opts.limit || 20
  const offset = (page - 1) * limit

  const conditions = [eq(vouchers.userId, userId)]
  if (opts.status) {
    conditions.push(eq(vouchers.status, opts.status as VoucherStatus))
  } else {
    conditions.push(sql`${vouchers.status} <> 'created'`)
  }

  const items = await db
    .select({
      voucher: vouchers,
      service: {
        id: services.id,
        name: services.name,
        images: services.images,
        productType: services.productType,
        fulfillmentType: services.fulfillmentType,
      },
      vendor: { name: vendors.name },
      orderItem: { quantity: orderItems.quantity, totalPrice: orderItems.totalPrice },
    })
    .from(vouchers)
    .innerJoin(services, eq(vouchers.serviceId, services.id))
    .innerJoin(vendors, eq(vouchers.vendorId, vendors.id))
    .innerJoin(orderItems, eq(vouchers.orderItemId, orderItems.id))
    .where(and(...conditions))
    .orderBy(sql`${vouchers.createdAt} DESC`)
    .limit(limit)
    .offset(offset)

  const countRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(vouchers)
    .where(and(...conditions))

  return {
    items: items.map(toTouristVoucherListItem),
    total: Number(scalar(countRows).count),
    page,
    limit,
  }
}

// ─── List vendor vouchers ──────────────────────────────
export async function listVouchersByVendorIds(
  vendorIds: string[],
  opts: { status?: string; page?: number; limit?: number },
) {
  const db = getDb()
  const page = opts.page || 1
  const limit = opts.limit || 20
  const offset = (page - 1) * limit

  if (!vendorIds.length) return { items: [], total: 0, page, limit }

  const statuses = opts.status
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  const conditions = [inArray(vouchers.vendorId, vendorIds)]
  if (statuses?.length) conditions.push(inArray(vouchers.status, statuses as VoucherStatus[]))

  const rows = await db
    .select({
      voucher: vouchers,
      service: {
        name: services.name,
        productType: services.productType,
        fulfillmentType: services.fulfillmentType,
      },
      customer: { fullName: users.fullName, email: users.email, phone: users.phone },
      orderItem: { totalPrice: orderItems.totalPrice },
    })
    .from(vouchers)
    .innerJoin(services, eq(vouchers.serviceId, services.id))
    .innerJoin(users, eq(vouchers.userId, users.id))
    .innerJoin(orderItems, eq(vouchers.orderItemId, orderItems.id))
    .where(and(...conditions))
    .orderBy(sql`${vouchers.createdAt} DESC`)
    .limit(limit)
    .offset(offset)

  const countRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(vouchers)
    .where(and(...conditions))

  const items = rows.map((row) => toVendorVoucher(row))
  return { items, total: Number(scalar(countRows).count), page, limit }
}

// ─── Get voucher detail with QR ────────────────────────
export async function getVoucherDetail(voucherId: string, userId: string) {
  if (!UUID_RE.test(voucherId)) throw new VoucherError('NOT_FOUND', 'Voucher không tồn tại.')

  const db = getDb()
  const [result] = await db
    .select({
      voucher: vouchers,
      service: {
        id: services.id,
        name: services.name,
        images: services.images,
        description: services.description,
        productType: services.productType,
        fulfillmentType: services.fulfillmentType,
      },
      vendor: { name: vendors.name },
      orderItem: { quantity: orderItems.quantity, totalPrice: orderItems.totalPrice },
    })
    .from(vouchers)
    .innerJoin(services, eq(vouchers.serviceId, services.id))
    .innerJoin(vendors, eq(vouchers.vendorId, vendors.id))
    .innerJoin(orderItems, eq(vouchers.orderItemId, orderItems.id))
    .where(and(eq(vouchers.id, voucherId), eq(vouchers.userId, userId)))
    .limit(1)

  if (!result) throw new VoucherError('NOT_FOUND', 'Voucher không tồn tại.')
  return toTouristVoucherListItem(result)
}

// ─── Get vendor voucher detail ─────────────────────────
export async function getVoucherDetailForVendor(voucherId: string, vendorIds: string[]) {
  if (!UUID_RE.test(voucherId) || !vendorIds.length) {
    throw new VoucherError('NOT_FOUND', 'Voucher không tồn tại.')
  }

  const db = getDb()
  const [result] = await db
    .select({
      voucher: vouchers,
      service: {
        name: services.name,
        productType: services.productType,
        fulfillmentType: services.fulfillmentType,
      },
      customer: { fullName: users.fullName, email: users.email, phone: users.phone },
      orderItem: { totalPrice: orderItems.totalPrice },
    })
    .from(vouchers)
    .innerJoin(services, eq(vouchers.serviceId, services.id))
    .innerJoin(users, eq(vouchers.userId, users.id))
    .innerJoin(orderItems, eq(vouchers.orderItemId, orderItems.id))
    .where(and(eq(vouchers.id, voucherId), inArray(vouchers.vendorId, vendorIds)))
    .limit(1)

  if (!result) throw new VoucherError('NOT_FOUND', 'Voucher không tồn tại.')
  return toVendorVoucher(result)
}

function normalizeVoucherArtifact(row: {
  voucher: typeof vouchers.$inferSelect
  service: { productType?: string | null; fulfillmentType?: string | null }
}) {
  const productType = normalizeProductType({
    productType: row.service.productType as any,
    fulfillmentType: row.service.fulfillmentType as any,
  })
  return {
    ...row.voucher,
    artifact_type: row.voucher.artifactType,
    product_type: productType,
  }
}

function toTouristVoucherListItem(row: {
  voucher: typeof vouchers.$inferSelect
  service: { productType?: string | null; fulfillmentType?: string | null }
}) {
  return {
    ...row,
    voucher: normalizeVoucherArtifact(row),
  }
}

function toVendorVoucher(row: {
  voucher: typeof vouchers.$inferSelect
  service: { name: string; productType?: string | null; fulfillmentType?: string | null }
  customer: { fullName: string | null; email: string | null; phone: string | null }
  orderItem: { totalPrice: string }
}) {
  const artifact = normalizeVoucherArtifact(row)
  return {
    ...artifact,
    service_name: row.service.name,
    customer_name:
      row.customer.fullName || row.customer.email || row.customer.phone || 'Khách hàng',
    final_amount: Number(row.orderItem.totalPrice),
  }
}

export class VoucherError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'VoucherError'
  }
}
