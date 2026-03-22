'use client'

import { settlementApi } from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export default function SettlementsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settlements'],
    queryFn: () => settlementApi.list(),
  })

  const approveMut = useMutation({
    mutationFn: settlementApi.approve,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-settlements'] }),
  })
  const disburseMut = useMutation({
    mutationFn: settlementApi.disburse,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-settlements'] }),
  })
  const rejectMut = useMutation({
    mutationFn: (id: string) => settlementApi.reject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-settlements'] }),
  })
  const batchMut = useMutation({
    mutationFn: settlementApi.runBatch,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-settlements'] }),
  })

  const settlements: any[] = data?.data?.items || data?.data || []
  const fmt = (n?: number | string) => n != null ? Number(n).toLocaleString('vi-VN') : '—'

  const totalValue = settlements.reduce((s: number, b: any) => s + Number(b.totalAmount || 0), 0)
  const totalCommission = settlements.reduce((s: number, b: any) => s + Number(b.commissionAmount || 0), 0)
  const pending = settlements.filter((s: any) => s.status === 'pending').length
  const disbursed = settlements.reduce((s: number, b: any) => b.status === 'disbursed' ? s + Number(b.netAmount || 0) : s, 0)

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-on-surface">Quản lý thanh toán</h1>
          <p className="text-sm text-on-surface-variant mt-1">Duyệt và giải ngân cho vendor — hoa hồng 8%</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => batchMut.mutate()}
            disabled={batchMut.isPending}
            className="px-5 py-2.5 text-sm font-medium rounded-full bg-gradient-to-br from-primary to-primary-container text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {batchMut.isPending ? 'Đang chạy...' : 'Chạy batch thanh toán'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-on-surface">{fmt(totalValue)}₫</p>
          <p className="text-xs text-on-surface-variant mt-1">Tổng giá trị</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-primary">{fmt(totalCommission)}₫</p>
          <p className="text-xs text-on-surface-variant mt-1">Hoa hồng (8%)</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-tertiary">{pending}</p>
          <p className="text-xs text-on-surface-variant mt-1">Chờ duyệt</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-primary">{fmt(disbursed)}₫</p>
          <p className="text-xs text-on-surface-variant mt-1">Đã giải ngân</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-on-surface-variant">Đang tải...</div>
        ) : settlements.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <p className="text-4xl mb-2">💳</p>
            <p className="text-sm">Chưa có batch thanh toán nào</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/15">
                <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Mã</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Vendor</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Tổng</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Hoa hồng</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Thực nhận</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Trạng thái</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((s: any) => (
                <tr key={s.id} className="border-b border-outline-variant/10 hover:bg-surface-low/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono font-medium text-primary">{s.id?.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-sm text-on-surface">{s.vendorId?.slice(0, 8) || '—'}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-on-surface">{fmt(s.totalAmount)}₫</td>
                  <td className="px-6 py-4 text-sm text-right text-error">{fmt(s.commissionAmount)}₫</td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-primary">{fmt(s.netAmount)}₫</td>
                  <td className="px-6 py-4"><SettlementStatus status={s.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {s.status === 'pending' && (
                        <>
                          <button onClick={() => approveMut.mutate(s.id)} disabled={approveMut.isPending} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-50">Duyệt</button>
                          <button onClick={() => rejectMut.mutate(s.id)} disabled={rejectMut.isPending} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-error/10 text-error hover:bg-error/20 disabled:opacity-50">Từ chối</button>
                        </>
                      )}
                      {s.status === 'approved' && (
                        <button onClick={() => disburseMut.mutate(s.id)} disabled={disburseMut.isPending} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-50">Giải ngân</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

function SettlementStatus({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Chờ duyệt', cls: 'bg-tertiary-fixed/50 text-tertiary' },
    approved: { label: 'Đã duyệt', cls: 'bg-primary-fixed/30 text-primary' },
    disbursed: { label: 'Đã giải ngân', cls: 'bg-secondary-container/50 text-secondary' },
    rejected: { label: 'Từ chối', cls: 'bg-error/10 text-error' },
  }
  const s = map[status] || { label: status, cls: '' }
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
}
