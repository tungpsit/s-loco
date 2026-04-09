'use client'

import Sidebar, { MobileTopBar, SidebarProvider } from '@/components/sidebar'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isLoading, isAuthenticated, router])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container animate-pulse" />
          <p className="text-sm text-on-surface-variant animate-pulse">Đang xác thực...</p>
        </div>
      </div>
    )
  }

  // Don't render dashboard if not authenticated
  if (!isAuthenticated) return null

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-surface">
        <Sidebar />
        {/* Content wrapper — full width on mobile, offset by sidebar on desktop */}
        <div className="md:ml-64 min-w-0">
          <MobileTopBar />
          <main className="px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
