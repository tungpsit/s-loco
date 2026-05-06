'use client'

import { orderApi } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, page],
    queryFn: () => orderApi.list({ status: statusFilter || undefined, page }),
  })

  const orders: any[] = data?.data?.items || data?.data || []
  const total = data?.data?.total || orders.length
  const fmt = (n?: number | string) => n != null ? Number(n).toLocaleString('vi-VN') : '—'
  const refundedCount = orders.filter((o: any) => o.status === 'refunded').length
  const partiallyRefundedCount = orders.filter((o: any) => o.status === 'partially_refunded').length

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-on-surface">Quản lý đơn hàng</h1>
          <p className="text-sm text-on-surface-variant mt-1">Tất cả đơn hàng trên nền tảng</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="bg-surface-high rounded-xl px-4 py-2.5 text-sm text-on-surface border-none outline-none w-full sm:w-auto"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="paid">Đã thanh toán</option>
          <option value="created">Chờ thanh toán</option>
          <option value="partially_refunded">Hoàn một phần</option>
          <option value="refunded">Đã hoàn tiền</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
        <div className="bg-white rounded-xl p-3 md:p-4 text-center">
          <p className="text-lg md:text-2xl font-display font-bold text-on-surface">{total}</p>
          <p className="text-xs text-on-surface-variant mt-1">Tổng đơn</p>
        </div>
        <div className="bg-white rounded-xl p-3 md:p-4 text-center">
          <p className="text-lg md:text-2xl font-display font-bold text-primary">{orders.filter((o: any) => o.status === 'paid').length}</p>
          <p className="text-xs text-on-surface-variant mt-1">Đã TT</p>
        </div>
        <div className="bg-white rounded-xl p-3 md:p-4 text-center">
          <p className="text-lg md:text-2xl font-display font-bold text-blue-700">{partiallyRefundedCount}</p>
          <p className="text-xs text-on-surface-variant mt-1">Hoàn một phần</p>
        </div>
        <div className="bg-white rounded-xl p-3 md:p-4 text-center">
          <p className="text-lg md:text-2xl font-display font-bold text-slate-600">{refundedCount}</p>
          <p className="text-xs text-on-surface-variant mt-1">Đã hoàn</p>
        </div>
        <div className="bg-white rounded-xl p-3 md:p-4 text-center">
          <p className="text-lg md:text-2xl font-display font-bold text-error">{orders.filter((o: any) => o.status === 'cancelled').length}</p>
          <p className="text-xs text-on-surface-variant mt-1">Đã hủy</p>
        </div>
      </div>

      {/* Table (desktop) / Cards (mobile) */}
      <div className="bg-white rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-on-surface-variant">Đang tải...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <p className="text-4xl mb-2">🛒</p>
            <p className="text-sm">Chưa có đơn hàng nào</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden md:table w-full">
              <thead>
                <tr className="border-b border-outline-variant/15">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Mã đơn</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Khách hàng</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Tổng tiền</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Trạng thái</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Ngày</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o.id} className="border-b border-outline-variant/10 hover:bg-surface-low/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-medium text-primary">{o.id?.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm text-on-surface">{o.userId?.slice(0, 8) || '—'}</td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-on-surface">{fmt(o.finalAmount)}₫</td>
                    <td className="px-6 py-4"><OrderStatus status={o.status} /></td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-outline-variant/10">
              {orders.map((o: any) => (
                <div key={o.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono font-medium text-primary">#{o.id?.slice(0, 8)}</span>
                      <OrderStatus status={o.status} />
                    </div>
                    <p className="font-display font-bold text-on-surface text-sm shrink-0">{fmt(o.finalAmount)}₫</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant">
                    <span>KH: {o.userId?.slice(0, 8) || '—'}</span>
                    <span>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-sm rounded-lg bg-surface-high text-on-surface-variant disabled:opacity-30">← Trước</button>
          <span className="px-4 py-2 text-sm text-on-surface-variant">Trang {page}</span>
          <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-sm rounded-lg bg-surface-high text-on-surface-variant">Tiếp →</button>
        </div>
      )}
    </>
  )
}

function OrderStatus({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    paid: { label: 'Đã TT', cls: 'bg-primary-fixed/30 text-primary' },
    created: { label: 'Chờ TT', cls: 'bg-tertiary-fixed/50 text-tertiary' },
    cancelled: { label: 'Đã hủy', cls: 'bg-error/10 text-error' },
    refunded: { label: 'Đã hoàn tiền', cls: 'bg-slate-100 text-slate-700' },
    partially_refunded: { label: 'Hoàn một phần', cls: 'bg-blue-50 text-blue-700' },
  }
  const s = map[status] || { label: status, cls: '' }
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
}
