'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/dashboard', icon: '📊', label: 'Tổng quan' },
  { href: '/dashboard/vendors', icon: '🏪', label: 'Vendor' },
  { href: '/dashboard/orders', icon: '🛒', label: 'Đơn hàng' },
  { href: '/dashboard/settlements', icon: '💳', label: 'Thanh toán' },
  { href: '/dashboard/content', icon: '📝', label: 'Nội dung' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white border-r border-outline-variant/15">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-outline-variant/15">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-container text-lg text-white font-bold">
          S
        </span>
        <div>
          <p className="font-display font-bold text-on-surface text-sm">S-Local Admin</p>
          <p className="text-xs text-on-surface-variant">Quản trị hệ thống</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary-fixed/30 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-low hover:text-on-surface'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-outline-variant/15">
        <p className="text-xs text-outline">v1.0.0 • Sầm Sơn, Thanh Hóa</p>
      </div>
    </aside>
  )
}
