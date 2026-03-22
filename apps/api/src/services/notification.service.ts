import { getDb } from '@s-local/db'
import { notifications } from '@s-local/db/schema'
import { and, eq, sql } from 'drizzle-orm'

// ─── Create notification ───────────────────────────────
export async function createNotification(userId: string, type: string, title: string, body: string, data?: Record<string, unknown>) {
  const db = getDb()
  const [notif] = await db.insert(notifications).values({
    userId, type, title, body, data,
  }).returning()
  return notif!
}

// ─── List user notifications ───────────────────────────
export async function listNotifications(userId: string, opts: { page?: number; limit?: number; unread_only?: boolean }) {
  const db = getDb()
  const page = opts.page || 1
  const limit = opts.limit || 20
  const offset = (page - 1) * limit

  const conditions = [eq(notifications.userId, userId)]
  if (opts.unread_only) conditions.push(eq(notifications.isRead, false))

  const items = await db.select().from(notifications)
    .where(and(...conditions))
    .orderBy(sql`${notifications.createdAt} DESC`)
    .limit(limit)
    .offset(offset)

  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(notifications).where(and(...conditions))

  return { items, total: Number(count), page, limit }
}

// ─── Mark as read ──────────────────────────────────────
export async function markAsRead(notificationId: string, userId: string) {
  const db = getDb()
  const [updated] = await db.update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .returning()
  return updated
}

// ─── Mark all as read ──────────────────────────────────
export async function markAllAsRead(userId: string) {
  const db = getDb()
  await db.update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
}

// ─── Unread count ──────────────────────────────────────
export async function getUnreadCount(userId: string) {
  const db = getDb()
  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
  return Number(count)
}

// ─── Notify helpers (fire-and-forget) ──────────────────
export async function notifyOrderCreated(userId: string, orderId: string) {
  return createNotification(userId, 'order_created', 'Đặt hàng thành công!', `Đơn hàng #${orderId.slice(0, 8)} đã được tạo.`, { orderId })
}

export async function notifyPaymentSuccess(userId: string, orderId: string) {
  return createNotification(userId, 'payment_success', 'Thanh toán thành công!', `Đơn hàng #${orderId.slice(0, 8)} đã được thanh toán. Voucher đã sẵn sàng.`, { orderId })
}

export async function notifyVendorNewOrder(vendorOwnerId: string, orderId: string) {
  return createNotification(vendorOwnerId, 'vendor_new_order', 'Đơn hàng mới!', `Bạn có đơn hàng mới #${orderId.slice(0, 8)}.`, { orderId })
}

export async function notifyVoucherRedeemed(userId: string, voucherId: string) {
  return createNotification(userId, 'voucher_redeemed', 'Voucher đã được sử dụng', `Voucher #${voucherId.slice(0, 8)} đã được đổi thành công.`, { voucherId })
}
