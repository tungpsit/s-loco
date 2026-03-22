'use client'

import { vendorApi } from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export default function VendorsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vendors', statusFilter, page],
    queryFn: () => vendorApi.list({ status: statusFilter || undefined, page }),
  })

  const approveMut = useMutation({
    mutationFn: vendorApi.approve,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-vendors'] }),
  })
  const suspendMut = useMutation({
    mutationFn: vendorApi.suspend,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-vendors'] }),
  })

  const vendors: any[] = data?.data?.items || data?.data || []
  const total = data?.data?.total || vendors.length

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-on-surface">Quản lý Vendor</h1>
          <p className="text-sm text-on-surface-variant mt-1">Duyệt, quản lý và giám sát vendor</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="bg-surface-high rounded-xl px-4 py-2.5 text-sm text-on-surface border-none outline-none"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ duyệt</option>
          <option value="active">Đang hoạt động</option>
          <option value="suspended">Tạm dừng</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-on-surface">{total}</p>
          <p className="text-xs text-on-surface-variant mt-1">Tổng Vendor</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-primary">{vendors.filter((v: any) => v.status === 'active').length}</p>
          <p className="text-xs text-on-surface-variant mt-1">Đang hoạt động</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-tertiary">{vendors.filter((v: any) => v.status === 'pending').length}</p>
          <p className="text-xs text-on-surface-variant mt-1">Chờ duyệt</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-on-surface-variant">Đang tải...</div>
        ) : vendors.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <p className="text-4xl mb-2">🏪</p>
            <p className="text-sm">Chưa có vendor nào</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/15">
                <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Vendor</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Liên hệ</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Trạng thái</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Ngày tạo</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v: any) => (
                <tr key={v.id} className="border-b border-outline-variant/10 hover:bg-surface-low/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-on-surface text-sm">{v.name}</p>
                    {v.address && <p className="text-xs text-on-surface-variant mt-0.5">{v.address}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{v.phone || v.email || '—'}</td>
                  <td className="px-6 py-4"><StatusBadge status={v.status} /></td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">
                    {v.createdAt ? new Date(v.createdAt).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {v.status === 'pending' && (
                        <button
                          onClick={() => approveMut.mutate(v.id)}
                          disabled={approveMut.isPending}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          Duyệt
                        </button>
                      )}
                      {v.status === 'active' && (
                        <button
                          onClick={() => suspendMut.mutate(v.id)}
                          disabled={suspendMut.isPending}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-error text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          Tạm dừng
                        </button>
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-primary-fixed/30 text-primary',
    pending: 'bg-tertiary-fixed/50 text-tertiary',
    suspended: 'bg-error/10 text-error',
  }
  const labels: Record<string, string> = { active: 'Hoạt động', pending: 'Chờ duyệt', suspended: 'Tạm dừng' }
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || ''}`}>
      {labels[status] || status}
    </span>
  )
}
