'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import {
  type AdminNotification,
  type NotificationCategory,
  type NotificationSeverity,
  notificationApi,
} from '@/lib/api'
import { enableAdminWebPush } from '@/lib/push-notifications'

const categories: Array<{ value: NotificationCategory | ''; label: string }> = [
  { value: '', label: 'Tất cả nhóm' },
  { value: 'order', label: 'Đơn hàng' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'settlement', label: 'Đối soát' },
  { value: 'payment', label: 'Thanh toán' },
  { value: 'refund', label: 'Refund' },
  { value: 'content', label: 'Nội dung' },
  { value: 'system', label: 'Hệ thống' },
]

const severities: Array<{ value: NotificationSeverity | ''; label: string }> = [
  { value: '', label: 'Tất cả mức độ' },
  { value: 'critical', label: 'Khẩn cấp' },
  { value: 'warning', label: 'Cảnh báo' },
  { value: 'success', label: 'Thành công' },
  { value: 'info', label: 'Thông tin' },
]

const categoryMeta: Record<NotificationCategory, { icon: string; label: string }> = {
  order: { icon: '🛒', label: 'Đơn hàng' },
  vendor: { icon: '🏪', label: 'Vendor' },
  settlement: { icon: '💳', label: 'Đối soát' },
  payment: { icon: '⚠️', label: 'Thanh toán' },
  refund: { icon: '↩️', label: 'Refund' },
  content: { icon: '📝', label: 'Nội dung' },
  system: { icon: '🛡️', label: 'Hệ thống' },
}

const severityClass: Record<NotificationSeverity, string> = {
  critical: 'bg-error/10 text-error',
  warning: 'bg-amber-50 text-amber-700',
  success: 'bg-primary-fixed/30 text-primary',
  info: 'bg-surface-high text-on-surface-variant',
}

const severityLabel: Record<NotificationSeverity, string> = {
  critical: 'Khẩn cấp',
  warning: 'Cảnh báo',
  success: 'Thành công',
  info: 'Thông tin',
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const [category, setCategory] = useState<NotificationCategory | ''>('')
  const [severity, setSeverity] = useState<NotificationSeverity | ''>('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [pushMessage, setPushMessage] = useState<string>('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-notifications', category, severity, unreadOnly, page],
    queryFn: () =>
      notificationApi.list({ category, severity, unread: unreadOnly, page, limit: 20 }),
  })

  const markRead = useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () => invalidateNotifications(queryClient),
  })

  const markAllRead = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => invalidateNotifications(queryClient),
  })

  const enablePush = useMutation({
    mutationFn: enableAdminWebPush,
    onSuccess: (result) => setPushMessage(result.message),
  })

  const notifications = data?.data?.items ?? []
  const total = data?.data?.total ?? 0
  const unreadCount = notifications.filter((item) => !item.isRead).length

  const onFilterChange = (next: () => void) => {
    next()
    setPage(1)
  }

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-on-surface">Thông báo</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Theo dõi các sự kiện vận hành quan trọng của hệ thống admin.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => enablePush.mutate()}
            disabled={enablePush.isPending}
            className="rounded-xl bg-surface-high px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-low disabled:opacity-60"
          >
            {enablePush.isPending ? 'Đang bật...' : 'Bật push trình duyệt'}
          </button>
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending || total === 0}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
          >
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      </div>

      {pushMessage && (
        <div className="mb-5 rounded-2xl bg-white px-4 py-3 text-sm text-on-surface-variant border border-outline-variant/15">
          {pushMessage}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <SummaryCard label="Tổng thông báo" value={total} />
        <SummaryCard label="Chưa đọc trong trang" value={unreadCount} tone="warning" />
        <SummaryCard
          label="Khẩn cấp"
          value={notifications.filter((n) => n.severity === 'critical').length}
          tone="critical"
        />
        <SummaryCard
          label="Cảnh báo"
          value={notifications.filter((n) => n.severity === 'warning').length}
          tone="warning"
        />
      </div>

      <div className="bg-white rounded-2xl p-4 md:p-5 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={category}
            onChange={(event) =>
              onFilterChange(() => setCategory(event.target.value as NotificationCategory | ''))
            }
            className="bg-surface-high rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none"
          >
            {categories.map((item) => (
              <option key={item.value || 'all'} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            value={severity}
            onChange={(event) =>
              onFilterChange(() => setSeverity(event.target.value as NotificationSeverity | ''))
            }
            className="bg-surface-high rounded-xl px-4 py-2.5 text-sm text-on-surface outline-none"
          >
            {severities.map((item) => (
              <option key={item.value || 'all'} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-xl bg-surface-high px-4 py-2.5 text-sm text-on-surface">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(event) => onFilterChange(() => setUnreadOnly(event.target.checked))}
            />
            Chỉ chưa đọc
          </label>
          <button
            type="button"
            onClick={() => {
              setCategory('')
              setSeverity('')
              setUnreadOnly(false)
              setPage(1)
            }}
            className="rounded-xl bg-surface-high px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-low"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-on-surface-variant">Đang tải thông báo...</div>
        ) : error ? (
          <div className="p-12 text-center text-error">Không tải được danh sách thông báo.</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <p className="text-4xl mb-2">🔔</p>
            <p className="text-sm">Chưa có thông báo phù hợp</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {notifications.map((item) => (
              <NotificationItem
                key={item.id}
                item={item}
                onMarkRead={() => markRead.mutate(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-sm rounded-lg bg-surface-high text-on-surface-variant disabled:opacity-30"
          >
            ← Trước
          </button>
          <span className="px-4 py-2 text-sm text-on-surface-variant">Trang {page}</span>
          <button
            type="button"
            disabled={page * 20 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm rounded-lg bg-surface-high text-on-surface-variant disabled:opacity-30"
          >
            Tiếp →
          </button>
        </div>
      )}
    </>
  )
}

function NotificationItem({
  item,
  onMarkRead,
}: {
  item: AdminNotification
  onMarkRead: () => void
}) {
  const meta = categoryMeta[item.category] ?? categoryMeta.system
  const actionUrl = typeof item.data?.actionUrl === 'string' ? item.data.actionUrl : undefined

  return (
    <article className={`p-4 md:p-5 ${item.isRead ? 'bg-white' : 'bg-primary-fixed/10'}`}>
      <div className="flex gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-high text-xl">
          {meta.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-on-surface-variant">{meta.label}</span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${severityClass[item.severity]}`}
                >
                  {severityLabel[item.severity]}
                </span>
                {!item.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
              </div>
              <h2 className="mt-2 font-display font-semibold text-on-surface">{item.title}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">{item.body}</p>
            </div>
            <time className="text-xs text-on-surface-variant shrink-0">
              {formatDate(item.createdAt)}
            </time>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {actionUrl && (
              <Link
                href={actionUrl}
                onClick={() => !item.isRead && onMarkRead()}
                className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90"
              >
                Xem chi tiết
              </Link>
            )}
            {!item.isRead && (
              <button
                type="button"
                onClick={onMarkRead}
                className="rounded-lg bg-surface-high px-3 py-2 text-xs font-medium text-on-surface-variant hover:bg-surface-low"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'critical' | 'warning'
}) {
  const cls =
    tone === 'critical' ? 'text-error' : tone === 'warning' ? 'text-amber-700' : 'text-on-surface'
  return (
    <div className="bg-white rounded-xl p-4 text-center">
      <p className={`text-xl md:text-2xl font-display font-bold ${cls}`}>{value}</p>
      <p className="text-xs text-on-surface-variant mt-1">{label}</p>
    </div>
  )
}

function invalidateNotifications(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
  queryClient.invalidateQueries({ queryKey: ['admin-notification-count'] })
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
