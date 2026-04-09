'use client'

import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'

const nav = [
  { href: '/dashboard', icon: '📊', label: 'Tổng quan' },
  { href: '/dashboard/vendors', icon: '🏪', label: 'Vendor' },
  { href: '/dashboard/orders', icon: '🛒', label: 'Đơn hàng' },
  { href: '/dashboard/settlements', icon: '💳', label: 'Đối soát' },
  { href: '/dashboard/content', icon: '📝', label: 'Nội dung' },
  { href: '/dashboard/users', icon: '👤', label: 'Người dùng' },
]

/* ── Context for open/close ──────────────────────── */
const SidebarCtx = createContext({ open: false, setOpen: (_v: boolean) => {} })

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return <SidebarCtx.Provider value={{ open, setOpen }}>{children}</SidebarCtx.Provider>
}

/* ── Mobile top-bar ──────────────────────────────── */
export function MobileTopBar() {
  const { setOpen } = useContext(SidebarCtx)
  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 bg-white/90 backdrop-blur-sm border-b border-outline-variant/15 px-4 py-3 md:hidden">
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-high text-on-surface"
        aria-label="Mở menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
      </button>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-container text-sm text-white font-bold">
        S
      </span>
      <p className="font-display font-bold text-on-surface text-sm">S-Loco Admin</p>
    </header>
  )
}

/* ── Sidebar drawer & desktop panel ──────────────── */
export default function Sidebar() {
  const pathname = usePathname()
  const { open, setOpen } = useContext(SidebarCtx)
  const { user, logout } = useAuth()

  // Close drawer on route change
  useEffect(() => { setOpen(false) }, [pathname, setOpen])

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* ── Overlay (mobile) ────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar panel ───────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white border-r border-outline-variant/15
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:transition-none
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/15">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-container text-lg text-white font-bold">
              S
            </span>
            <div>
              <p className="font-display font-bold text-on-surface text-sm">S-Loco Admin</p>
              <p className="text-xs text-on-surface-variant">Quản trị hệ thống</p>
            </div>
          </div>
          {/* Close button (mobile only) */}
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-high md:hidden"
            aria-label="Đóng menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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

        {/* Footer — User + Logout */}
        <div className="px-4 py-4 border-t border-outline-variant/15 space-y-3">
          {user && (
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-fixed-dim to-primary-fixed text-xs font-bold text-primary shrink-0">
                {user.fullName?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">{user.fullName || 'Admin'}</p>
                <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-error hover:bg-error/5 transition-colors w-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  )
}
