'use client'

import { dashboardApi } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: dashboardApi.adminStats,
  })

  const stats = data?.data
  const fmt = (n?: number | string) => n != null ? Number(n).toLocaleString('vi-VN') : '—'

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-on-surface">Tổng quan</h1>
        <p className="text-sm text-on-surface-variant mt-1">Số liệu hoạt động nền tảng S-Loco</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard icon="💰" label="Tổng doanh thu" value={isLoading ? '...' : `${fmt(stats?.totalRevenue)}₫`} accent="bg-primary-fixed" />
        <StatCard icon="🛒" label="Tổng đơn hàng" value={isLoading ? '...' : fmt(stats?.totalOrders)} accent="bg-secondary-container" />
        <StatCard icon="🏪" label="Vendor hoạt động" value={isLoading ? '...' : fmt(stats?.activeVendors)} accent="bg-tertiary-fixed" />
        <StatCard icon="💳" label="Chờ giải ngân" value={isLoading ? '...' : `${fmt(stats?.pendingSettlements)}₫`} accent="bg-primary-fixed-dim" />
      </div>

      {/* Revenue + Commission */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6">
          <h2 className="font-display font-semibold text-on-surface mb-4">Doanh thu theo tháng</h2>
          <div className="h-64 flex items-center justify-center text-on-surface-variant">
            <div className="text-center">
              <p className="text-4xl mb-2">📈</p>
              <p className="text-sm">Biểu đồ doanh thu sẽ hiển thị khi có dữ liệu</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6">
          <h2 className="font-display font-semibold text-on-surface mb-4">Hoa hồng</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-outline-variant/15">
              <span className="text-sm text-on-surface-variant">Tổng hoa hồng</span>
              <span className="font-display font-bold text-on-surface">{fmt(stats?.totalCommission)}₫</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-outline-variant/15">
              <span className="text-sm text-on-surface-variant">Đã giải ngân</span>
              <span className="font-display font-bold text-primary">{fmt(stats?.disbursedAmount)}₫</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-on-surface-variant">Chờ duyệt</span>
              <span className="font-display font-bold text-tertiary">{fmt(stats?.pendingBatches)} batch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6">
        <h2 className="font-display font-semibold text-on-surface mb-4">Hoạt động gần đây</h2>
        <div className="text-center py-12 text-on-surface-variant">
          <p className="text-4xl mb-2">📋</p>
          <p className="text-sm">Chưa có hoạt động nào</p>
        </div>
      </div>
    </>
  )
}

function StatCard({ icon, label, value, accent }: { icon: string; label: string; value: string; accent: string }) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl p-5">
      <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${accent}`}>{icon}</span>
      <div>
        <p className="text-sm text-on-surface-variant">{label}</p>
        <p className="text-2xl font-display font-bold text-on-surface">{value}</p>
      </div>
    </div>
  )
}
