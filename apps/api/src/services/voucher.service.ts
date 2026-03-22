import { getDb } from '@s-local/db'
import { services, vouchers } from '@s-local/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { SignJWT, jwtVerify } from 'jose'

const QR_SECRET = new TextEncoder().encode(process.env.QR_SECRET || 'qr-dev-secret')

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
    .sign(QR_SECRET)
}

// ─── Verify QR JWT ─────────────────────────────────────
export async function verifyQrToken(token: string): Promise<{ voucherId: string }> {
  try {
    const { payload } = await jwtVerify(token, QR_SECRET)
    return { voucherId: payload.voucher_id as string }
  } catch {
    throw new VoucherError('INVALID_QR', 'Mã QR không hợp lệ hoặc đã hết hạn.')
  }
}

// ─── List user's vouchers ──────────────────────────────
export async function listVouchersByUser(userId: string, opts: { status?: string; page?: number; limit?: number }) {
  const db = getDb()
  const page = opts.page || 1
  const limit = opts.limit || 20
  const offset = (page - 1) * limit

  const conditions = [eq(vouchers.userId, userId)]
  if (opts.status) conditions.push(eq(vouchers.status, opts.status as any))

  const items = await db.select({
    voucher: vouchers,
    service: { id: services.id, name: services.name, images: services.images },
  })
    .from(vouchers)
    .innerJoin(services, eq(vouchers.serviceId, services.id))
    .where(and(...conditions))
    .orderBy(sql`${vouchers.createdAt} DESC`)
    .limit(limit)
    .offset(offset)

  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(vouchers)
    .where(and(...conditions))

  return { items, total: Number(count), page, limit }
}

// ─── Get voucher detail with QR ────────────────────────
export async function getVoucherDetail(voucherId: string, userId: string) {
  const db = getDb()
  const [result] = await db.select({
    voucher: vouchers,
    service: { id: services.id, name: services.name, images: services.images, description: services.description },
  })
    .from(vouchers)
    .innerJoin(services, eq(vouchers.serviceId, services.id))
    .where(and(eq(vouchers.id, voucherId), eq(vouchers.userId, userId)))
    .limit(1)

  if (!result) throw new VoucherError('NOT_FOUND', 'Voucher không tồn tại.')
  return result
}

export class VoucherError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'VoucherError'
  }
}
