'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { notificationApi } from '@/lib/api'

export function NotificationBell() {
  const { data } = useQuery({
    queryKey: ['admin-notification-count'],
    queryFn: notificationApi.count,
    refetchInterval: 45_000,
  })

  const unread = Number(data?.data?.unread ?? 0)

  return (
    <Link
      href="/dashboard/notifications"
      className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white text-on-surface shadow-sm border border-outline-variant/15 hover:bg-surface-low transition-colors"
      aria-label="Thông báo"
    >
      <span className="text-lg">🔔</span>
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-error px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  )
}
