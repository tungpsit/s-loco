import { getDb } from '../db'
import { orderItems, settlementItems, settlements, vendors, vouchers } from '@S-Loco/db/schema'
import { and, eq, gte, lte, sql } from 'drizzle-orm'
import { settlementDirectionForProductType } from './product-types'

/** Non-null assertion for Drizzle scalar selects */
function scalar<T>(rows: T[]): T {
  return rows[0]!
}

const COMMISSION_RATE = 0.08 // 8% total: 5% tourist discount + 3% platform
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// ─── Create settlement batch for a vendor ──────────────
export async function createSettlementBatch(vendorId: string, periodStart: Date, periodEnd: Date) {
  const db = getDb()

  // Find COMPLETED vouchers in period that haven't been settled
  const completedVouchers = await db
    .select({
      voucher: vouchers,
      orderItem: orderItems,
    })
    .from(vouchers)
    .innerJoin(orderItems, eq(vouchers.orderItemId, orderItems.id))
    .where(
      and(
        eq(vouchers.vendorId, vendorId),
        eq(vouchers.status, 'completed'),
        gte(vouchers.completedAt!, periodStart),
        lte(vouchers.completedAt!, periodEnd),
      ),
    )

  if (completedVouchers.length === 0) return null

  // Calculate totals
  let totalAmount = 0
  const items: Array<{ voucherId: string; amount: number; commission: number }> = []

  for (const row of completedVouchers) {
    const amount = Number(row.orderItem.unitPrice)
    const commission = Math.round(amount * COMMISSION_RATE * 100) / 100
    totalAmount += amount
    items.push({ voucherId: row.voucher.id, amount, commission })
  }

  const commissionAmount = items.reduce((sum, i) => sum + i.commission, 0)
  const netAmount = totalAmount - commissionAmount

  // Create settlement + items in transaction
  const result = await db.transaction(async (tx) => {
    const [settlement] = await tx
      .insert(settlements)
      .values({
        vendorId,
        periodStart,
        periodEnd,
        totalAmount: String(totalAmount),
        commissionAmount: String(commissionAmount),
        netAmount: String(netAmount),
        direction: settlementDirectionForProductType('voucher'),
        voucherCount: items.length,
        status: 'pending',
      })
      .returning()

    for (const item of items) {
      await tx.insert(settlementItems).values({
        settlementId: settlement!.id,
        voucherId: item.voucherId,
        amount: String(item.amount),
        commission: String(item.commission),
      })
    }

    // Mark vouchers as settled
    for (const item of items) {
      await tx
        .update(vouchers)
        .set({ status: 'settled', settledAt: new Date(), updatedAt: new Date() })
        .where(eq(vouchers.id, item.voucherId))
    }

    return settlement!
  })

  return result
}

// ─── Admin approve settlement ──────────────────────────
export async function approveSettlement(settlementId: string, adminId: string) {
  const db = getDb()
  const [updated] = await db
    .update(settlements)
    .set({ status: 'approved', approvedBy: adminId, updatedAt: new Date() })
    .where(and(eq(settlements.id, settlementId), eq(settlements.status, 'pending')))
    .returning()
  if (!updated)
    throw new SettlementError('NOT_FOUND', 'Settlement không tồn tại hoặc đã được xử lý.')
  return updated
}

// ─── Admin disburse settlement ─────────────────────────
export async function disburseSettlement(settlementId: string) {
  const db = getDb()
  const [updated] = await db
    .update(settlements)
    .set({ status: 'disbursed', disbursedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(settlements.id, settlementId), eq(settlements.status, 'approved')))
    .returning()
  if (!updated)
    throw new SettlementError('NOT_FOUND', 'Settlement chưa được duyệt hoặc đã giải ngân.')
  return updated
}

// ─── Admin reject settlement ───────────────────────────
export async function rejectSettlement(settlementId: string) {
  const db = getDb()
  const [updated] = await db
    .update(settlements)
    .set({ status: 'rejected', updatedAt: new Date() })
    .where(and(eq(settlements.id, settlementId), eq(settlements.status, 'pending')))
    .returning()
  if (!updated)
    throw new SettlementError('NOT_FOUND', 'Settlement không tồn tại hoặc đã được xử lý.')
  return updated
}

// ─── Vendor settlement history ─────────────────────────
export async function listSettlementsByVendor(
  vendorId: string,
  opts: { page?: number; limit?: number },
) {
  const db = getDb()
  const page = opts.page || 1
  const limit = opts.limit || 20
  const offset = (page - 1) * limit

  const items = await db
    .select()
    .from(settlements)
    .where(eq(settlements.vendorId, vendorId))
    .orderBy(sql`${settlements.createdAt} DESC`)
    .limit(limit)
    .offset(offset)

  const countRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(settlements)
    .where(eq(settlements.vendorId, vendorId))

  return { items, total: Number(scalar(countRows).count), page, limit }
}

// ─── Vendor settlement detail ─────────────────────────
export async function getSettlementByVendor(settlementId: string, vendorId: string) {
  if (!UUID_RE.test(settlementId)) {
    throw new SettlementError('NOT_FOUND', 'Settlement không tồn tại.')
  }

  const db = getDb()
  const [settlement] = await db
    .select()
    .from(settlements)
    .where(and(eq(settlements.id, settlementId), eq(settlements.vendorId, vendorId)))
    .limit(1)

  if (!settlement) throw new SettlementError('NOT_FOUND', 'Settlement không tồn tại.')
  return settlement
}

// ─── Admin list all settlements ────────────────────────
export async function listAllSettlements(opts: { status?: string; page?: number; limit?: number }) {
  const db = getDb()
  const page = opts.page || 1
  const limit = opts.limit || 20
  const offset = (page - 1) * limit

  const conditions: ReturnType<typeof eq>[] = []
  if (opts.status) conditions.push(eq(settlements.status, opts.status as any))
  const where = conditions.length ? and(...conditions) : undefined

  const items = await db
    .select({ settlement: settlements, vendor: { id: vendors.id, name: vendors.name } })
    .from(settlements)
    .innerJoin(vendors, eq(settlements.vendorId, vendors.id))
    .where(where)
    .orderBy(sql`${settlements.createdAt} DESC`)
    .limit(limit)
    .offset(offset)

  const rows2 = await db.select({ count: sql<number>`count(*)` }).from(settlements).where(where)

  return { items, total: Number(scalar(rows2).count), page, limit }
}

// ─── Reconciliation report ─────────────────────────────
export async function getReconciliationReport(periodStart: Date, periodEnd: Date) {
  const db = getDb()

  const [settlementTotals] = await db
    .select({
      totalAmount: sql<string>`COALESCE(SUM(${settlements.totalAmount}::numeric), 0)`,
      totalCommission: sql<string>`COALESCE(SUM(${settlements.commissionAmount}::numeric), 0)`,
      totalNet: sql<string>`COALESCE(SUM(${settlements.netAmount}::numeric), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(settlements)
    .where(and(gte(settlements.periodStart, periodStart), lte(settlements.periodEnd, periodEnd)))!

  return {
    period: { start: periodStart, end: periodEnd },
    totalVoucherAmount: settlementTotals!.totalAmount,
    totalCommission: settlementTotals!.totalCommission,
    totalVendorNet: settlementTotals!.totalNet,
    settlementCount: Number(settlementTotals!.count),
    balanced:
      Number(settlementTotals!.totalAmount) ===
      Number(settlementTotals!.totalCommission) + Number(settlementTotals!.totalNet),
  }
}

export class SettlementError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'SettlementError'
  }
}
