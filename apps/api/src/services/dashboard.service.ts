import { getDb } from '@s-local/db'
import { orderItems, orders, settlements, vendors, vouchers } from '@s-local/db/schema'
import { and, eq, gte, sql } from 'drizzle-orm'

// ─── Vendor Dashboard ──────────────────────────────────
export async function getVendorDashboard(vendorId: string) {
  const db = getDb()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Today's orders
  const [todayStats] = await db.select({
    orderCount: sql<number>`count(DISTINCT ${orderItems.orderId})`,
    revenue: sql<string>`COALESCE(SUM(${orderItems.totalPrice}::numeric), 0)`,
    voucherCount: sql<number>`count(${vouchers.id})`,
  })
    .from(orderItems)
    .leftJoin(vouchers, eq(vouchers.orderItemId, orderItems.id))
    .where(and(eq(orderItems.vendorId, vendorId), gte(orderItems.orderId, sql`(SELECT id FROM orders WHERE created_at >= ${today} LIMIT 1)`)))

  // Total stats
  const [totalStats] = await db.select({
    totalRevenue: sql<string>`COALESCE(SUM(${orderItems.totalPrice}::numeric), 0)`,
    totalOrders: sql<number>`count(DISTINCT ${orderItems.orderId})`,
    activeVouchers: sql<number>`count(CASE WHEN ${vouchers.status} IN ('paid', 'redeemed') THEN 1 END)`,
  })
    .from(orderItems)
    .leftJoin(vouchers, eq(vouchers.orderItemId, orderItems.id))
    .where(eq(orderItems.vendorId, vendorId))

  // Settlement summary
  const [settlementStats] = await db.select({
    totalSettled: sql<string>`COALESCE(SUM(${settlements.netAmount}::numeric), 0)`,
    pendingSettlement: sql<string>`COALESCE(SUM(CASE WHEN ${settlements.status} = 'pending' THEN ${settlements.netAmount}::numeric ELSE 0 END), 0)`,
  })
    .from(settlements)
    .where(eq(settlements.vendorId, vendorId))

  return {
    today: {
      orders: Number(todayStats.orderCount),
      revenue: todayStats.revenue,
      vouchers: Number(todayStats.voucherCount),
    },
    total: {
      revenue: totalStats.totalRevenue,
      orders: Number(totalStats.totalOrders),
      activeVouchers: Number(totalStats.activeVouchers),
    },
    settlement: {
      totalSettled: settlementStats.totalSettled,
      pendingSettlement: settlementStats.pendingSettlement,
    },
  }
}

// ─── Admin Dashboard ───────────────────────────────────
export async function getAdminDashboard() {
  const db = getDb()

  // Revenue totals
  const [revStats] = await db.select({
    totalRevenue: sql<string>`COALESCE(SUM(${orders.finalAmount}::numeric), 0)`,
    totalOrders: sql<number>`count(*)`,
    paidOrders: sql<number>`count(CASE WHEN ${orders.status} = 'paid' THEN 1 END)`,
  }).from(orders)

  // Vendor count
  const [vendorStats] = await db.select({
    total: sql<number>`count(*)`,
    active: sql<number>`count(CASE WHEN ${vendors.status} = 'active' THEN 1 END)`,
  }).from(vendors)

  // Settlement totals
  const [settlStats] = await db.select({
    totalDisbursed: sql<string>`COALESCE(SUM(CASE WHEN ${settlements.status} = 'disbursed' THEN ${settlements.netAmount}::numeric ELSE 0 END), 0)`,
    totalCommission: sql<string>`COALESCE(SUM(${settlements.commissionAmount}::numeric), 0)`,
    pending: sql<number>`count(CASE WHEN ${settlements.status} = 'pending' THEN 1 END)`,
  }).from(settlements)

  return {
    revenue: { total: revStats.totalRevenue, orders: Number(revStats.totalOrders), paidOrders: Number(revStats.paidOrders) },
    vendors: { total: Number(vendorStats.total), active: Number(vendorStats.active) },
    settlements: { totalDisbursed: settlStats.totalDisbursed, totalCommission: settlStats.totalCommission, pendingCount: Number(settlStats.pending) },
  }
}

// ─── Admin: orders list with filters ───────────────────
export async function listAllOrders(opts: { status?: string; vendor_id?: string; page?: number; limit?: number }) {
  const db = getDb()
  const page = opts.page || 1
  const limit = opts.limit || 20
  const offset = (page - 1) * limit

  const conditions: ReturnType<typeof eq>[] = []
  if (opts.status) conditions.push(eq(orders.status, opts.status as any))
  const where = conditions.length ? and(...conditions) : undefined

  const items = await db.select().from(orders)
    .where(where)
    .orderBy(sql`${orders.createdAt} DESC`)
    .limit(limit)
    .offset(offset)

  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(orders).where(where)

  return { items, total: Number(count), page, limit }
}
