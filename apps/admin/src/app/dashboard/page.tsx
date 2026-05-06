'use client'

import { dashboardApi } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const fmt = (n?: number | string) => n != null ? Number(n).toLocaleString('vi-VN') : '—'
const fmtVND = (n?: number | string) => n != null ? `${Number(n).toLocaleString('vi-VN')}₫` : '—'
const tooltipNumber = (value: number | string | readonly (string | number)[] | undefined) => {
  if (Array.isArray(value)) return Number(value[0] ?? 0)
  return Number(value ?? 0)
}

// Chart color tokens matching S-Loco palette
const CHART_COLORS = {
  primary: '#2D6A4F',
  secondary: '#40916C',
  tertiary: '#74C69D',
  amber: '#F4A261',
  red: '#E76F51',
  muted: '#94A3B8',
}

const PIE_COLORS = ['#2D6A4F', '#F4A261', '#E76F51', '#64748B', '#2563EB']

// Mock data — last 7 days revenue breakdown
function getLast7DaysRevenue(): { day: string; revenue: number }[] {
  const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
  return days.map((day, i) => ({
    day,
    revenue: Math.floor(Math.random() * 8_000_000) + 1_000_000,
  }))
}

function getOrderStatusBreakdown(stats: any) {
  const orderStats = stats?.revenue ?? stats
  const total = Number(orderStats?.orders ?? orderStats?.totalOrders ?? 0)
  const paid = Number(orderStats?.paidOrders ?? 0)
  const created = Number(orderStats?.createdOrders ?? Math.max(total - paid, 0))
  const cancelled = Number(orderStats?.cancelledOrders ?? 0)
  const refunded = Number(orderStats?.refundedOrders ?? 0)
  const partiallyRefunded = Number(orderStats?.partiallyRefundedOrders ?? 0)
  return [
    { name: 'Đã thanh toán', value: paid },
    { name: 'Chờ thanh toán', value: created },
    { name: 'Đã hủy', value: cancelled },
    { name: 'Hoàn tiền', value: refunded },
    { name: 'Hoàn một phần', value: partiallyRefunded },
  ].filter((item) => item.value > 0)
}

// Mock top vendors by revenue
function getTopVendors(): { name: string; revenue: number }[] {
  return [
    { name: 'Bãi Biển Mười', revenue: 12_400_000 },
    { name: 'Khách Sạn Sông Hàn', revenue: 9_800_000 },
    { name: 'Nhà Hàng Biển Xanh', revenue: 7_200_000 },
    { name: 'Quán Cà Phê Sáng', revenue: 4_600_000 },
    { name: 'Khu Du Lịch Đồi', revenue: 3_100_000 },
  ]
}

// Shared chart tooltip formatter
const tooltipFormatter = (value: number) => [value.toLocaleString('vi-VN') + '₫', 'Doanh thu']
const tooltipLabelStyle = { color: '#374151' }

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

  // Chart data derived from API response
  const revenueChartData = getLast7DaysRevenue()
  const orderStatusData = getOrderStatusBreakdown(stats)
  const topVendorsData = getTopVendors()

  // Custom tooltip style for recharts
  const customTooltipStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '12px',
    color: '#374151',
  }

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
          value={statsLoading ? '...' : fmt(stats?.revenue?.orders ?? stats?.totalOrders)}
          accent="bg-secondary-container"
        />
        <StatCard
          icon="💰"
          label="Doanh thu hôm nay"
          value={statsLoading ? '...' : fmtVND(stats?.revenue?.total ?? stats?.totalRevenue)}
          accent="bg-primary-fixed"
        />
        <StatCard
          icon="🏪"
          label="Vendor hoạt động"
          value={statsLoading ? '...' : fmt(stats?.vendors?.active ?? stats?.activeVendors)}
          accent="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          icon="🎟️"
          label="Voucher hôm nay"
          value={statsLoading ? '...' : fmt(stats?.vouchersToday ?? stats?.todayVouchers ?? '0')}
          accent="bg-tertiary-fixed"
        />
      </div>

      {/* Charts Row */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mb-6 md:mb-8'>
        {/* Revenue Overview Bar Chart */}
        <div className='bg-white rounded-2xl overflow-hidden'>
          <div className='px-6 py-4 border-b border-outline-variant/15'>
            <h2 className='font-display font-semibold text-on-surface text-sm'>Doanh thu 7 ngày qua</h2>
          </div>
          <div className='p-4'>
            {statsLoading ? (
              <div className='h-[300px] flex items-center justify-center text-on-surface-variant'>Đang tải…</div>
            ) : revenueChartData.length === 0 ? (
              <div className='h-[300px] flex items-center justify-center text-on-surface-variant text-sm'>Chưa có dữ liệu</div>
            ) : (
              <ResponsiveContainer width='100%' height={300}>
                <BarChart data={revenueChartData} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' vertical={false} />
                  <XAxis dataKey='day' tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                  <Tooltip
                    contentStyle={customTooltipStyle}
                    formatter={(value) => [`${tooltipNumber(value).toLocaleString('vi-VN')}₫`, 'Doanh thu']}
                    labelStyle={{ color: '#374151', fontWeight: 600 }}
                  />
                  <Bar dataKey='revenue' fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Order Status Pie Chart */}
        <div className='bg-white rounded-2xl overflow-hidden'>
          <div className='px-6 py-4 border-b border-outline-variant/15'>
            <h2 className='font-display font-semibold text-on-surface text-sm'>Trạng thái đơn hàng</h2>
          </div>
          <div className='p-4'>
            {statsLoading ? (
              <div className='h-[300px] flex items-center justify-center text-on-surface-variant'>Đang tải…</div>
            ) : orderStatusData.every(d => d.value === 0) ? (
              <div className='h-[300px] flex items-center justify-center text-on-surface-variant text-sm'>Chưa có dữ liệu</div>
            ) : (
              <ResponsiveContainer width='100%' height={300}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    dataKey='value'
                    nameKey='name'
                    cx='50%'
                    cy='50%'
                    outerRadius={100}
                    innerRadius={55}
                    paddingAngle={3}
                  >
                    {orderStatusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i] ?? CHART_COLORS.muted} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={customTooltipStyle}
                    formatter={(value, name) => [`${tooltipNumber(value)} đơn`, String(name)]}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Legend
                    iconType='circle'
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px', color: '#374151', paddingTop: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top Vendors Horizontal Bar Chart */}
      <div className='bg-white rounded-2xl overflow-hidden mb-6 md:mb-8'>
        <div className='flex items-center justify-between px-6 py-4 border-b border-outline-variant/15'>
          <h2 className='font-display font-semibold text-on-surface text-sm'>Top Vendor theo doanh thu</h2>
        </div>
        <div className='p-4'>
          {statsLoading ? (
            <div className='h-[300px] flex items-center justify-center text-on-surface-variant'>Đang tải…</div>
          ) : topVendorsData.length === 0 ? (
            <div className='h-[300px] flex items-center justify-center text-on-surface-variant text-sm'>Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={topVendorsData} layout='vertical' margin={{ top: 8, right: 40, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' horizontal={false} />
                <XAxis type='number' tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                <YAxis type='category' dataKey='name' tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={130} />
                <Tooltip
                  contentStyle={customTooltipStyle}
                  formatter={(value) => [`${tooltipNumber(value).toLocaleString('vi-VN')}₫`, 'Doanh thu']}
                  labelStyle={{ color: '#374151', fontWeight: 600 }}
                />
                <Bar dataKey='revenue' radius={[0, 4, 4, 0]} maxBarSize={28}>
                  {topVendorsData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? CHART_COLORS.primary : i === 1 ? CHART_COLORS.secondary : i === 2 ? CHART_COLORS.tertiary : CHART_COLORS.amber} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
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
