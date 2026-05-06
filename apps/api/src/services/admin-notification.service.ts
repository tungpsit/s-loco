import { notifications, users } from '@S-Loco/db/schema'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '../db'
import { createNotification } from './notification.service'

export const notificationCategories = [
  'order',
  'vendor',
  'settlement',
  'payment',
  'refund',
  'content',
  'system',
] as const

export const notificationSeverities = ['info', 'success', 'warning', 'critical'] as const

export type NotificationCategory = (typeof notificationCategories)[number]
export type NotificationSeverity = (typeof notificationSeverities)[number]

type AdminNotificationInput = {
  type: string
  category: NotificationCategory
  severity: NotificationSeverity
  title: string
  body: string
  actionUrl?: string
  data?: Record<string, unknown>
}

export type NotificationFilters = {
  unread_only?: boolean
  category?: NotificationCategory
  severity?: NotificationSeverity
  page?: number
  limit?: number
}

export function normalizeNotificationCategory(value: unknown): NotificationCategory {
  return notificationCategories.includes(value as NotificationCategory)
    ? (value as NotificationCategory)
    : 'system'
}

export function normalizeNotificationSeverity(value: unknown): NotificationSeverity {
  return notificationSeverities.includes(value as NotificationSeverity)
    ? (value as NotificationSeverity)
    : 'info'
}

export function buildNotificationFilters(input: {
  unreadOnly?: boolean
  category?: unknown
  severity?: unknown
  page?: number
  limit?: number
}): NotificationFilters {
  return {
    unread_only: input.unreadOnly,
    category: input.category ? normalizeNotificationCategory(input.category) : undefined,
    severity: input.severity ? normalizeNotificationSeverity(input.severity) : undefined,
    page: Math.max(1, Number(input.page || 1)),
    limit: Math.min(100, Math.max(1, Number(input.limit || 20))),
  }
}

export function buildAdminNotification(input: AdminNotificationInput) {
  return {
    type: input.type,
    category: input.category,
    severity: input.severity,
    title: input.title,
    body: input.body,
    data: {
      ...(input.data ?? {}),
      ...(input.actionUrl ? { actionUrl: input.actionUrl } : {}),
      category: input.category,
      severity: input.severity,
    },
  }
}

export async function listAdminUserIds(): Promise<string[]> {
  const db = getDb()
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`${users.role} = 'admin' AND ${users.isActive} = true`)
  return rows.map((row) => row.id)
}

export async function notifyAdmins(input: AdminNotificationInput) {
  const adminIds = [...new Set(await listAdminUserIds())]
  const payload = buildAdminNotification(input)

  const created: Array<typeof notifications.$inferSelect> = []
  for (const adminId of adminIds) {
    const notification = await createNotification(
      adminId,
      payload.type,
      payload.title,
      payload.body,
      payload.data,
      payload.category,
      payload.severity,
    )
    created.push(notification)
  }
  return created
}

export async function notifyAdminsOrderPaid(order: {
  id: string
  finalAmount?: string | number | null
}) {
  return notifyAdmins({
    type: 'admin_order_paid',
    category: 'order',
    severity: 'success',
    title: 'Đơn hàng đã thanh toán',
    body: `Đơn hàng #${order.id.slice(0, 8)} đã thanh toán ${formatMoney(order.finalAmount)}.`,
    actionUrl: `/dashboard/orders?orderId=${order.id}`,
    data: { orderId: order.id, finalAmount: order.finalAmount },
  })
}

export async function notifyAdminsOrderCancelled(order: {
  id: string
  finalAmount?: string | number | null
}) {
  return notifyAdmins({
    type: 'admin_order_cancelled',
    category: 'order',
    severity: 'warning',
    title: 'Đơn hàng đã hủy',
    body: `Đơn hàng #${order.id.slice(0, 8)} đã bị hủy.`,
    actionUrl: `/dashboard/orders?orderId=${order.id}`,
    data: { orderId: order.id, finalAmount: order.finalAmount },
  })
}

export async function notifyAdminsVendorCreated(vendor: {
  id: string
  name: string
  status?: string | null
}) {
  return notifyAdmins({
    type: 'admin_vendor_pending',
    category: 'vendor',
    severity: vendor.status === 'pending' || !vendor.status ? 'warning' : 'info',
    title: 'Vendor mới chờ duyệt',
    body: `${vendor.name} vừa được tạo và cần kiểm tra trạng thái hoạt động.`,
    actionUrl: `/dashboard/vendors?vendorId=${vendor.id}`,
    data: { vendorId: vendor.id, vendorName: vendor.name, status: vendor.status },
  })
}

export async function notifyAdminsVendorStatusChanged(vendor: {
  id: string
  name: string
  status: string
}) {
  const statusLabel = vendorStatusLabel(vendor.status)
  return notifyAdmins({
    type: 'admin_vendor_status_changed',
    category: 'vendor',
    severity: vendor.status === 'suspended' || vendor.status === 'rejected' ? 'warning' : 'info',
    title: 'Trạng thái vendor thay đổi',
    body: `${vendor.name} đã chuyển sang trạng thái ${statusLabel}.`,
    actionUrl: `/dashboard/vendors?vendorId=${vendor.id}`,
    data: { vendorId: vendor.id, vendorName: vendor.name, status: vendor.status },
  })
}

export async function notifyAdminsSettlementPending(settlement: {
  id: string
  vendorId: string
  netAmount?: string | number | null
}) {
  return notifyAdmins({
    type: 'admin_settlement_pending',
    category: 'settlement',
    severity: 'warning',
    title: 'Đối soát mới chờ duyệt',
    body: `Settlement #${settlement.id.slice(0, 8)} cần admin duyệt (${formatMoney(settlement.netAmount)}).`,
    actionUrl: `/dashboard/settlements?settlementId=${settlement.id}`,
    data: {
      settlementId: settlement.id,
      vendorId: settlement.vendorId,
      netAmount: settlement.netAmount,
    },
  })
}

export async function notifyAdminsRefundRequested(input: {
  refundId?: string
  voucherId: string
  orderId?: string
  amount?: string | number | null
  status?: string
}) {
  return notifyAdmins({
    type: 'admin_refund_requested',
    category: 'refund',
    severity:
      input.status === 'manual_processing' || input.status === 'pending' ? 'critical' : 'warning',
    title: 'Yêu cầu hoàn tiền cần theo dõi',
    body: `Voucher #${input.voucherId.slice(0, 8)} có yêu cầu hoàn tiền ${formatMoney(input.amount)}.`,
    actionUrl: input.orderId ? `/dashboard/orders?orderId=${input.orderId}` : '/dashboard/orders',
    data: input,
  })
}

export async function notifyAdminsRefundCompleted(input: { refundId: string; status: string }) {
  return notifyAdmins({
    type: 'admin_refund_completed',
    category: 'refund',
    severity: 'success',
    title: 'Refund đã hoàn tất',
    body: `Refund #${input.refundId.slice(0, 8)} đã được xử lý xong.`,
    actionUrl: '/dashboard/orders',
    data: input,
  })
}

export async function notifyAdminsWebhookFailed(input: {
  gateway: string
  code?: string
  message: string
  transactionId?: string
}) {
  return notifyAdmins({
    type:
      input.code === 'AMOUNT_MISMATCH' ? 'admin_payment_amount_mismatch' : 'admin_webhook_failed',
    category: 'payment',
    severity: 'critical',
    title: input.code === 'AMOUNT_MISMATCH' ? 'Thanh toán lệch số tiền' : 'Webhook thanh toán lỗi',
    body: `${input.gateway.toUpperCase()}: ${input.message}`,
    actionUrl: '/dashboard/orders',
    data: input,
  })
}

export async function notifyAdminsUserChanged(input: {
  userId: string
  action: 'role_change' | 'status_change' | 'profile_update'
  adminId: string
  oldValue?: unknown
  newValue?: unknown
}) {
  return notifyAdmins({
    type: `admin_user_${input.action}`,
    category: 'system',
    severity: input.action === 'role_change' ? 'warning' : 'info',
    title: 'Thông tin người dùng thay đổi',
    body: `Tài khoản #${input.userId.slice(0, 8)} vừa được cập nhật bởi admin.`,
    actionUrl: `/dashboard/users?userId=${input.userId}`,
    data: input,
  })
}

export async function notifyAdminsContentChanged(input: {
  articleId: string
  title: string
  action: 'created' | 'updated' | 'deleted' | 'published' | 'unpublished'
}) {
  return notifyAdmins({
    type: `admin_content_${input.action}`,
    category: 'content',
    severity: input.action === 'deleted' || input.action === 'unpublished' ? 'warning' : 'info',
    title: 'Nội dung đã thay đổi',
    body: `Bài viết "${input.title}" đã được ${contentActionLabel(input.action)}.`,
    actionUrl:
      input.action === 'deleted' ? '/dashboard/content' : `/dashboard/content/${input.articleId}`,
    data: input,
  })
}

export async function getNotificationOptions() {
  return {
    categories: notificationCategories,
    severities: notificationSeverities,
  }
}

export async function backfillNotificationMetadata() {
  const db = getDb()
  await db
    .update(notifications)
    .set({ category: 'system', severity: 'info' })
    .where(eq(notifications.category, 'system'))
}

function formatMoney(value: string | number | null | undefined) {
  if (value == null || value === '') return ''
  return `${Number(value).toLocaleString('vi-VN')}₫`
}

function vendorStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'chờ duyệt',
    active: 'đang hoạt động',
    suspended: 'tạm khóa',
    rejected: 'bị từ chối',
  }
  return labels[status] ?? status
}

function contentActionLabel(action: string) {
  const labels: Record<string, string> = {
    created: 'tạo',
    updated: 'cập nhật',
    deleted: 'xóa',
    published: 'xuất bản',
    unpublished: 'ẩn khỏi xuất bản',
  }
  return labels[action] ?? action
}
