'use client'

import { userApi, vendorApi } from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export default function VendorsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<any>(null)

  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vendors', statusFilter, page],
    queryFn: () => vendorApi.list({ status: statusFilter || undefined, page }),
  })

  const { data: usersData } = useQuery({
    queryKey: ['admin-users-vendor-owners'],
    queryFn: () => userApi.list({ role: 'vendor_owner', limit: 100 }),
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
  const vendorOwners = usersData?.data?.items || usersData?.data || []

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-on-surface">
            Quản lý Vendor
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">Duyệt, quản lý và giám sát vendor</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="bg-surface-high rounded-xl px-4 py-2.5 text-sm text-on-surface border-none outline-none w-full sm:w-auto"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="active">Đang hoạt động</option>
            <option value="suspended">Tạm dừng</option>
          </select>
          <button
            onClick={() => {
              setEditingVendor(null)
              setIsModalOpen(true)
            }}
            className="bg-primary text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
          >
            + Thêm Vendor
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="bg-white rounded-xl p-3 md:p-4 text-center">
          <p className="text-lg md:text-2xl font-display font-bold text-on-surface">{total}</p>
          <p className="text-xs text-on-surface-variant mt-1">Tổng Vendor</p>
        </div>
        <div className="bg-white rounded-xl p-3 md:p-4 text-center">
          <p className="text-lg md:text-2xl font-display font-bold text-primary">
            {vendors.filter((v: any) => v.status === 'active').length}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">Đang hoạt động</p>
        </div>
        <div className="bg-white rounded-xl p-3 md:p-4 text-center">
          <p className="text-lg md:text-2xl font-display font-bold text-tertiary">
            {vendors.filter((v: any) => v.status === 'pending').length}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">Chờ duyệt</p>
        </div>
      </div>

      {/* Table (desktop) / Cards (mobile) */}
      <div className="bg-white rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-on-surface-variant">Đang tải...</div>
        ) : vendors.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <p className="text-4xl mb-2">🏪</p>
            <p className="text-sm">Chưa có vendor nào</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden md:table w-full">
              <thead>
                <tr className="border-b border-outline-variant/15">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Liên hệ
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Hoa hồng
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v: any) => (
                  <tr
                    key={v.id}
                    className="border-b border-outline-variant/10 hover:bg-surface-low/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-on-surface text-sm">{v.name}</p>
                      {v.address && (
                        <p className="text-xs text-on-surface-variant mt-0.5">{v.address}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      <p>{v.phone || '—'}</p>
                      <p className="text-xs opacity-75">{v.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-on-surface">
                      {v.commissionRate}%
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <VendorMenu
                        v={v}
                        approveMut={approveMut}
                        suspendMut={suspendMut}
                        onEdit={() => {
                          setEditingVendor(v)
                          setIsModalOpen(true)
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-outline-variant/10">
              {vendors.map((v: any) => (
                <div key={v.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-on-surface text-sm truncate">{v.name}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {v.phone || v.email || '—'}
                      </p>
                    </div>
                    <StatusBadge status={v.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium bg-surface-high px-2 py-1 rounded-md">
                      Hoa hồng: {v.commissionRate}%
                    </p>
                    <VendorMenu
                      v={v}
                      approveMut={approveMut}
                      suspendMut={suspendMut}
                      onEdit={() => {
                        setEditingVendor(v)
                        setIsModalOpen(true)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <VendorFormModal
          vendor={editingVendor}
          vendorOwners={vendorOwners}
          onClose={() => {
            setIsModalOpen(false)
            setEditingVendor(null)
          }}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['admin-vendors'] })}
        />
      )}
    </>
  )
}

function VendorMenu({
  v,
  approveMut,
  suspendMut,
  onEdit,
}: { v: any; approveMut: any; suspendMut: any; onEdit: () => void }) {
  return (
    <div className="flex justify-end gap-2 items-center">
      <button
        onClick={onEdit}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-high text-on-surface hover:opacity-90 transition-opacity"
      >
        Sửa
      </button>
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
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-primary-fixed/30 text-primary',
    pending: 'bg-tertiary-fixed/50 text-tertiary',
    suspended: 'bg-error/10 text-error',
  }
  const labels: Record<string, string> = {
    active: 'Hoạt động',
    pending: 'Chờ duyệt',
    suspended: 'Tạm dừng',
  }
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${styles[status] || ''}`}
    >
      {labels[status] || status}
    </span>
  )
}

function VendorFormModal({
  vendor,
  vendorOwners,
  onClose,
  onSuccess,
}: { vendor: any; vendorOwners: any[]; onClose: () => void; onSuccess: () => void }) {
  const isEdit = !!vendor
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    owner_id: vendor?.ownerId || '',
    name: vendor?.name || '',
    slug: vendor?.slug || '',
    description: vendor?.description || '',
    address: vendor?.address || '',
    phone: vendor?.phone || '',
    email: vendor?.email || '',
    commission_rate: vendor?.commissionRate || '8.00',
  })

  // Auto generate slug from name if creating
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    if (!isEdit) {
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData({ ...formData, name, slug })
    } else {
      setFormData({ ...formData, name })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isEdit) {
        await vendorApi.update(vendor.id, {
          name: formData.name,
          description: formData.description,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          commission_rate: formData.commission_rate,
        })
      } else {
        await vendorApi.create(formData)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6 border-b border-outline-variant/15 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-display font-bold text-on-surface">
            {isEdit ? 'Sửa Vendor' : 'Thêm Vendor mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-high rounded-full transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-error/10 text-error p-3 rounded-xl text-sm font-medium">{error}</div>
          )}

          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Chủ cửa hàng (Owner)
              </label>
              <select
                required
                className="w-full bg-surface rounded-xl px-4 py-2.5 text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.owner_id}
                onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
              >
                <option value="">Chọn chủ cửa hàng...</option>
                {vendorOwners.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.email})
                  </option>
                ))}
              </select>
              <p className="text-xs text-on-surface-variant mt-1.5">
                Chỉ hiển thị user có role `vendor_owner`
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Tên Cửa Hàng
              </label>
              <input
                required
                className="w-full bg-surface rounded-xl px-4 py-2.5 text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="Ví dụ: Hải Sản Hương Biển"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Slug (đường dẫn)
              </label>
              <input
                required
                disabled={isEdit}
                className="w-full bg-surface rounded-xl px-4 py-2.5 text-sm border-none outline-none disabled:opacity-50"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="hai-san-huong-bien"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Trích phần trăm Hoa Hồng (%)
              </label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full bg-primary-fixed/20 text-primary-fixed-dim rounded-xl px-4 py-2.5 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 font-bold"
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
              />
              <p className="text-xs text-on-surface-variant mt-1.5">Mặc định là 8% (8.00)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Số Điện Thoại
              </label>
              <input
                className="w-full bg-surface rounded-xl px-4 py-2.5 text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Địa Chỉ</label>
            <input
              className="w-full bg-surface rounded-xl px-4 py-2.5 text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">
              Email liên hệ
            </label>
            <input
              type="email"
              className="w-full bg-surface rounded-xl px-4 py-2.5 text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Mô tả</label>
            <textarea
              className="w-full bg-surface rounded-xl px-4 py-2.5 text-sm border-none outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t border-outline-variant/15 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-medium text-sm text-on-surface bg-surface hover:bg-surface-high transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-primary hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
