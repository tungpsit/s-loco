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

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-on-surface">Quản lý đơn hàng</h1>
          <p className="text-sm text-on-surface-variant mt-1">Tất cả đơn hàng trên nền tảng</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="bg-surface-high rounded-xl px-4 py-2.5 text-sm text-on-surface border-none outline-none"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="paid">Đã thanh toán</option>
          <option value="created">Chờ thanh toán</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-on-surface">{total}</p>
          <p className="text-xs text-on-surface-variant mt-1">Tổng đơn</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-primary">{orders.filter((o: any) => o.status === 'paid').length}</p>
          <p className="text-xs text-on-surface-variant mt-1">Đã TT</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-error">{orders.filter((o: any) => o.status === 'cancelled').length}</p>
          <p className="text-xs text-on-surface-variant mt-1">Đã hủy</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-on-surface-variant">Đang tải...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <p className="text-4xl mb-2">🛒</p>
            <p className="text-sm">Chưa có đơn hàng nào</p>
          </div>
        ) : (
          <table className="w-full">
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
    refunded: { label: 'Hoàn tiền', cls: 'bg-outline-variant/20 text-outline' },
  }
  const s = map[status] || { label: status, cls: '' }
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
}
