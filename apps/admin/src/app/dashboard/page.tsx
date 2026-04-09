'use client'

import { dashboardApi } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

const fmt = (n?: number | string) => n != null ? Number(n).toLocaleString('vi-VN') : '—'
const fmtVND = (n?: number | string) => n != null ? `${Number(n).toLocaleString('vi-VN')}₫` : '—'

function StatCard({ icon, label, value, accent }: { icon: string; label: string; value: string; accent: string }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl p-4 md:p-5">
      <span className={`flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl text-lg md:text-xl ${accent}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs md:text-sm text-on-surface-variant truncate">{label}</p>
        <p className="text-lg md:text-2xl font-display font-bold text-on-surface truncate">{value}</p>
      </div>
    </div>
  )
}

function OrderStatus({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    paid:              { label: 'Đã TT',        cls: 'bg-primary-fixed/30 text-primary' },
    created:           { label: 'Chờ TT',        cls: 'bg-tertiary-fixed/50 text-tertiary' },
    cancelled:         { label: 'Đã hủy',         cls: 'bg-error/10 text-error' },
    refunded:          { label: 'Hoàn tiền',      cls: 'bg-outline-variant/20 text-outline' },
    partially_refunded:{ label: 'Hoàn một phần', cls: 'bg-blue-50 text-blue-700' },
  }
  const s = map[status] ?? { label: status ?? '—', cls: 'bg-surface-high text-on-surface-variant' }
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
}

export default function DashboardPage() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: dashboardApi.adminStats,
  })

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-dashboard-orders'],
    queryFn: () => dashboardApi.adminOrders(1, 10),
  })

  const stats = statsData?.data
  const recentOrders: any[] = ordersData?.data?.items || ordersData?.data || []

  return (
    <>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-display font-bold text-on-surface">Tổng quan</h1>
        <p className="text-sm text-on-surface-variant mt-1">Số liệu hoạt động nền tảng S-Loco</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
        <StatCard
          icon="🛒"
          label="Tổng đơn hàng"
          value={statsLoading ? '...' : fmt(stats?.totalOrders)}
          accent="bg-secondary-container"
        />
        <StatCard
          icon="💰"
          label="Doanh thu hôm nay"
          value={statsLoading ? '...' : fmtVND(stats?.todayRevenue ?? stats?.totalRevenue)}
          accent="bg-primary-fixed"
        />
        <StatCard
          icon="🏪"
          label="Vendor hoạt động"
          value={statsLoading ? '...' : fmt(stats?.activeVendors)}
          accent="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          icon="🎟️"
          label="Voucher hôm nay"
          value={statsLoading ? '...' : fmt(stats?.vouchersToday ?? stats?.todayVouchers ?? '0')}
          accent="bg-tertiary-fixed"
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/15">
          <h2 className="font-display font-semibold text-on-surface">Đơn hàng gần đây</h2>
          <a
            href="/dashboard/orders"
            className="text-xs font-medium text-primary hover:underline"
          >
            Xem tất cả →
          </a>
        </div>

        {ordersLoading ? (
          <div className="p-12 text-center text-on-surface-variant">Đang tải…</div>
        ) : recentOrders.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <p className="text-4xl mb-2">🛒</p>
            <p className="text-sm">Chưa có đơn hàng nào</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/15 bg-surface-low/40">
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Mã đơn</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Khách hàng</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Vendor</th>
                    <th className="text-right px-6 py-3.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Tổng tiền</th>
                    <th className="text-center px-6 py-3.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Trạng thái</th>
                    <th className="text-right px-6 py-3.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Ngày</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {recentOrders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-primary/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-medium text-primary">
                        #{String(o.id).slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface truncate max-w-[140px]">
                        {o.userId ? String(o.userId).slice(0, 8) : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface truncate max-w-[140px]">
                        {o.vendorName || o.vendorId ? String(o.vendorName ?? o.vendorId).slice(0, 8) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-on-surface whitespace-nowrap">
                        {fmtVND(o.finalAmount ?? o.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <OrderStatus status={o.status} />
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-on-surface-variant whitespace-nowrap">
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-outline-variant/10">
              {recentOrders.slice(0, 5).map((o: any) => (
                <div key={o.id} className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-medium text-primary">
                      #{String(o.id).slice(0, 8)}
                    </span>
                    <OrderStatus status={o.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </span>
                    <span className="text-sm font-bold text-on-surface">
                      {fmtVND(o.finalAmount ?? o.totalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
