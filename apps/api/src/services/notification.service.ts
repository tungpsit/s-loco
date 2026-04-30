// ─── Push token storage ─────────────────────────────────
// Stores in Redis for simplicity (no extra table needed for v1).
// Format: user:{userId}:push_token -> { token, platform, updatedAt }

import { getDb } from '../db'

/** Non-null assertion for Drizzle scalar selects */
function scalar<T>(rows: T[]): T {
  return rows[0]!
}

import { notifications, orderItems, orders, vendors } from '@S-Loco/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { redis } from '../lib/redis'

const PUSH_TOKEN_TTL = 60 * 60 * 24 * 30 // 30 days

type PendingNotification = {
  userId: string
  type: string
  title: string
  body: string
  data: Record<string, unknown>
}

export async function registerPushToken(userId: string, token: string, platform: string) {
  const key = `push_token:${userId}`
  await redis.hset(key, {
    token,
    platform,
    updatedAt: new Date().toISOString(),
  })
  await redis.expire(key, PUSH_TOKEN_TTL)
}

export async function getPushToken(
  userId: string,
): Promise<{ token: string; platform: string } | null> {
  const key = `push_token:${userId}`
  const data = await redis.hgetall(key)
  if (!data || !data.token) return null
  return { token: data.token, platform: data.platform! }
}

export async function deletePushToken(userId: string) {
  const key = `push_token:${userId}`
  await redis.del(key)
}

// ─── Create notification ───────────────────────────────
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  const db = getDb()
  const [notif] = await db
    .insert(notifications)
    .values({
      userId,
      type,
      title,
      body,
      data,
    })
    .returning()
  return notif!
}

// ─── List user notifications ───────────────────────────
export async function listNotifications(
  userId: string,
  opts: { page?: number; limit?: number; unread_only?: boolean },
) {
  const db = getDb()
  const page = opts.page || 1
  const limit = opts.limit || 20
  const offset = (page - 1) * limit

  const conditions = [eq(notifications.userId, userId)]
  if (opts.unread_only) conditions.push(eq(notifications.isRead, false))

  const items = await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(sql`${notifications.createdAt} DESC`)
    .limit(limit)
    .offset(offset)

  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(...conditions))

  return { items, total: Number(scalar(rows).count), page, limit }
}

// ─── Mark as read ──────────────────────────────────────
export async function markAsRead(notificationId: string, userId: string) {
  const db = getDb()
  const [updated] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .returning()
  return updated
}

// ─── Mark all as read ──────────────────────────────────
export async function markAllAsRead(userId: string) {
  const db = getDb()
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
}

// ─── Unread count ──────────────────────────────────────
export async function getUnreadCount(userId: string) {
  const db = getDb()
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))

  return Number(scalar(rows).count)
}

// ─── Notify helpers (fire-and-forget) ──────────────────
// Creates a DB notification record AND fires a real push notification.
export function buildOrderPaidNotifications(
  userId: string,
  orderId: string,
  vendorOwnerIds: string[],
): PendingNotification[] {
  const shortOrderId = orderId.slice(0, 8)
  const uniqueVendorOwnerIds = [...new Set(vendorOwnerIds)]

  return [
    {
      userId,
      type: 'payment_success',
      title: 'Thanh toán thành công!',
      body: `Đơn hàng #${shortOrderId} đã được thanh toán. Voucher đã sẵn sàng.`,
      data: { orderId },
    },
    ...uniqueVendorOwnerIds.map((vendorOwnerId) => ({
      userId: vendorOwnerId,
      type: 'vendor_new_order',
      title: 'Đơn hàng mới!',
      body: `Bạn có đơn hàng mới #${shortOrderId}.`,
      data: { orderId },
    })),
  ]
}

export async function notifyOrderPaid(orderId: string) {
  const db = getDb()
  const [order] = await db
    .select({ userId: orders.userId })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!order) return

  const ownerRows = await db
    .select({ ownerId: vendors.ownerId })
    .from(orderItems)
    .innerJoin(vendors, eq(orderItems.vendorId, vendors.id))
    .where(eq(orderItems.orderId, orderId))

  const pendingNotifications = buildOrderPaidNotifications(
    order.userId,
    orderId,
    ownerRows.map((row) => row.ownerId),
  )

  for (const item of pendingNotifications) {
    const notif = await createNotification(item.userId, item.type, item.title, item.body, item.data)
    fireAndForgetPush(item.userId, notif.title, notif.body, item.data)
  }
}

export async function notifyOrderCreated(userId: string, orderId: string) {
  const notif = await createNotification(
    userId,
    'order_created',
    'Đặt hàng thành công!',
    `Đơn hàng #${orderId.slice(0, 8)} đã được tạo.`,
    { orderId },
  )
  fireAndForgetPush(userId, notif.title, notif.body, { orderId })
}

export async function notifyPaymentSuccess(userId: string, orderId: string) {
  const notif = await createNotification(
    userId,
    'payment_success',
    'Thanh toán thành công!',
    `Đơn hàng #${orderId.slice(0, 8)} đã được thanh toán. Voucher đã sẵn sàng.`,
    { orderId },
  )
  fireAndForgetPush(userId, notif.title, notif.body, { orderId })
}

export async function notifyVendorNewOrder(vendorOwnerId: string, orderId: string) {
  const notif = await createNotification(
    vendorOwnerId,
    'vendor_new_order',
    'Đơn hàng mới!',
    `Bạn có đơn hàng mới #${orderId.slice(0, 8)}.`,
    { orderId },
  )
  fireAndForgetPush(vendorOwnerId, notif.title, notif.body, { orderId })
}

export async function notifyVoucherRedeemed(userId: string, voucherId: string) {
  const notif = await createNotification(
    userId,
    'voucher_redeemed',
    'Voucher đã được sử dụng',
    `Voucher #${voucherId.slice(0, 8)} đã được đổi thành công.`,
    { voucherId },
  )
  fireAndForgetPush(userId, notif.title, notif.body, { voucherId })
}

/** Fire push notification (no await — failures are non-critical) */
async function fireAndForgetPush(
  userId: string,
  title: string,
  body: string,
  data: Record<string, unknown>,
) {
  try {
    const pushData = await getPushToken(userId)
    if (!pushData) return

    const { sendPush } = await import('./push.service')
    await sendPush({
      token: pushData.token,
      platform: pushData.platform as 'android' | 'ios' | 'web',
      title,
      body,
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    })
  } catch (err) {
    // Log but never block the caller
    console.error(`[Push] Failed to send push to user ${userId}:`, err)
  }
}
