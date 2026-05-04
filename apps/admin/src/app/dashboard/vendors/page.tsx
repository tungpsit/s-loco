'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { type ChangeEvent, type FormEvent, type ReactNode, useState } from 'react'
import { ImageUploadField, MultiImageUploadField } from '@/components/ui'
import { VendorLocationPicker } from '@/components/vendor-location-picker'
import { serviceApi, userApi, vendorApi } from '@/lib/api'

type VendorStatus = 'pending' | 'active' | 'suspended' | 'rejected'

type AdminVendor = {
  id: string
  ownerId?: string
  name: string
  slug: string
  description?: string | null
  logoUrl?: string | null
  coverImageUrl?: string | null
  address?: string | null
  latitude?: string | null
  longitude?: string | null
  phone?: string | null
  email?: string | null
  commissionRate?: string | null
  appDiscountPercent?: string | null
  businessHours?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  settlementType?: 'instant' | 'periodic'
  settlementPeriodDays?: number
  rejectionReason?: string | null
  status: VendorStatus
}

type VendorOwner = { id: string; fullName?: string | null; email?: string | null }
type ServiceCategory = { id: string; name: string; slug: string }
type VendorService = {
  id: string
  vendorId: string
  categoryId: string
  name: string
  slug: string
  description?: string | null
  originalPrice: string
  discountPrice?: string | null
  discountPercent?: string | null
  fulfillmentType?: 'fixed_price' | 'reservation'
  reservationDiscountPercent?: string | null
  durationMinutes?: number | null
  maxQuantityPerOrder?: number | null
  images?: string[] | null
  isActive: boolean
  sortOrder: number
}

type VendorListResponse = { data?: { items?: AdminVendor[]; total?: number } | AdminVendor[] }
type UserListResponse = { data?: { items?: VendorOwner[] } | VendorOwner[] }
type ServiceListResponse = { data?: { services?: VendorService[] } }
type CategoryResponse = { data?: { categories?: ServiceCategory[] } }

const inputClass =
  'w-full bg-surface rounded-xl px-4 py-2.5 text-sm border-none outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50'

export default function VendorsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<AdminVendor | null>(null)
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

  const vendorData = data as VendorListResponse | undefined
  const userData = usersData as UserListResponse | undefined
  const vendors = Array.isArray(vendorData?.data) ? vendorData.data : vendorData?.data?.items || []
  const total = Array.isArray(vendorData?.data)
    ? vendors.length
    : vendorData?.data?.total || vendors.length
  const vendorOwners = Array.isArray(userData?.data) ? userData.data : userData?.data?.items || []

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-on-surface">
            Quản lý Vendor
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Duyệt, bổ sung hồ sơ và hỗ trợ vendor onboarding
          </p>
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
            <option value="rejected">Từ chối</option>
          </select>
          <button
            type="button"
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

      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        <StatCard label="Tổng Vendor" value={total} />
        <StatCard
          label="Đang hoạt động"
          value={vendors.filter((v) => v.status === 'active').length}
        />
        <StatCard label="Chờ duyệt" value={vendors.filter((v) => v.status === 'pending').length} />
      </div>

      <div className="bg-white rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-on-surface-variant">Đang tải...</div>
        ) : vendors.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">Chưa có vendor nào</div>
        ) : (
          <>
            <table className="hidden md:table w-full">
              <thead>
                <tr className="border-b border-outline-variant/15">
                  <TableHead>Vendor</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Ưu đãi</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead align="right">Thao tác</TableHead>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-outline-variant/10 hover:bg-surface-low/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {v.logoUrl && (
                          <Image
                            src={v.logoUrl}
                            alt=""
                            width={40}
                            height={40}
                            unoptimized
                            className="h-10 w-10 rounded-xl object-cover bg-surface"
                          />
                        )}
                        <div>
                          <p className="font-medium text-on-surface text-sm">{v.name}</p>
                          {v.address && (
                            <p className="text-xs text-on-surface-variant mt-0.5">{v.address}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      <p>{v.phone || '—'}</p>
                      <p className="text-xs opacity-75">{v.email || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-on-surface">
                      <p>Hoa hồng: {v.commissionRate || '0'}%</p>
                      <p className="text-xs text-on-surface-variant">
                        App: {v.appDiscountPercent || '0'}%
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <VendorMenu
                        v={v}
                        onApprove={() => approveMut.mutate(v.id)}
                        onSuspend={() => suspendMut.mutate(v.id)}
                        approveDisabled={approveMut.isPending}
                        suspendDisabled={suspendMut.isPending}
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
            <div className="md:hidden divide-y divide-outline-variant/10">
              {vendors.map((v) => (
                <div key={v.id} className="p-4 space-y-3">
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
                      Hoa hồng: {v.commissionRate || '0'}%
                    </p>
                    <VendorMenu
                      v={v}
                      onApprove={() => approveMut.mutate(v.id)}
                      onSuspend={() => suspendMut.mutate(v.id)}
                      approveDisabled={approveMut.isPending}
                      suspendDisabled={suspendMut.isPending}
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

function VendorFormModal({
  vendor,
  vendorOwners,
  onClose,
  onSuccess,
}: {
  vendor: AdminVendor | null
  vendorOwners: VendorOwner[]
  onClose: () => void
  onSuccess: () => void
}) {
  const isEdit = !!vendor
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [uploadingCount, setUploadingCount] = useState(0)
  const imageUploading = uploadingCount > 0
  const trackImageUploading = (isUploading: boolean) => {
    setUploadingCount((current) => Math.max(0, current + (isUploading ? 1 : -1)))
  }
  const [error, setError] = useState('')
  const [rejectionReason, setRejectionReason] = useState(vendor?.rejectionReason || '')
  const iposStoreId =
    vendor?.metadata && typeof vendor.metadata.ipos_store_id === 'string'
      ? vendor.metadata.ipos_store_id
      : ''
  const [formData, setFormData] = useState({
    owner_id: vendor?.ownerId || '',
    name: vendor?.name || '',
    slug: vendor?.slug || '',
    description: vendor?.description || '',
    address: vendor?.address || '',
    latitude: vendor?.latitude || '',
    longitude: vendor?.longitude || '',
    phone: vendor?.phone || '',
    email: vendor?.email || '',
    commission_rate: vendor?.commissionRate || '8.00',
    app_discount_percent: vendor?.appDiscountPercent || '5.00',
    business_hours: formatBusinessHours(vendor?.businessHours),
    ipos_store_id: iposStoreId,
    logo_url: vendor?.logoUrl || '',
    cover_image_url: vendor?.coverImageUrl || '',
    settlement_type: vendor?.settlementType || 'periodic',
    settlement_period_days: String(vendor?.settlementPeriodDays || 3),
  })

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData({ ...formData, name, slug: isEdit ? formData.slug : slugify(name) })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (imageUploading) {
      setError('Vui lòng chờ ảnh tải lên xong trước khi lưu.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = {
        name: formData.name,
        description: emptyToUndefined(formData.description),
        address: emptyToUndefined(formData.address),
        latitude: emptyToUndefined(formData.latitude),
        longitude: emptyToUndefined(formData.longitude),
        phone: emptyToUndefined(formData.phone),
        email: emptyToUndefined(formData.email),
        commission_rate: formData.commission_rate,
        app_discount_percent: formData.app_discount_percent,
        business_hours: parseJsonField(formData.business_hours),
        ipos_store_id: emptyToUndefined(formData.ipos_store_id),
        logo_url: emptyToUndefined(formData.logo_url),
        cover_image_url: emptyToUndefined(formData.cover_image_url),
        settlement_type: formData.settlement_type,
        settlement_period_days: Number(formData.settlement_period_days),
      }
      if (isEdit) {
        await vendorApi.update(vendor.id, payload)
      } else {
        await vendorApi.create({ ...payload, owner_id: formData.owner_id, slug: formData.slug })
      }
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }
  const changeStatus = async (status: VendorStatus) => {
    if (!vendor) return
    setStatusLoading(true)
    setError('')
    try {
      if (status === 'rejected') await vendorApi.reject(vendor.id, rejectionReason)
      if (status === 'active') await vendorApi.reactivate(vendor.id)
      if (status === 'suspended') await vendorApi.suspend(vendor.id)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setStatusLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6 border-b border-outline-variant/15 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-display font-bold text-on-surface">
              {isEdit ? 'Onboarding Vendor' : 'Thêm Vendor mới'}
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Hoàn thiện hồ sơ, ảnh, điều khoản và dịch vụ trước khi kích hoạt.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-surface-high rounded-full transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-error/10 text-error p-3 rounded-xl text-sm font-medium">{error}</div>
          )}
          {!isEdit && (
            <Section title="Chủ cửa hàng">
              <select
                required
                className={inputClass}
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
            </Section>
          )}
          <Section title="Hồ sơ hiển thị">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <TextInput
                label="Tên cửa hàng"
                required
                value={formData.name}
                onChange={handleNameChange}
              />
              <TextInput
                label="Slug"
                required
                disabled={isEdit}
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <TextArea
              label="Mô tả"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Section>
          <Section title="Liên hệ và vị trí">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <TextInput
                label="Số điện thoại"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <TextInput
                label="Email liên hệ"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <TextInput
              label="Địa chỉ"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <TextInput
                label="Vĩ độ"
                inputMode="decimal"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              />
              <TextInput
                label="Kinh độ"
                inputMode="decimal"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              />
            </div>
            <VendorLocationPicker
              latitude={formData.latitude}
              longitude={formData.longitude}
              onChange={(location) => setFormData((current) => ({ ...current, ...location }))}
            />
          </Section>
          <Section title="Điều khoản và vận hành">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <TextInput
                label="Hoa hồng (%)"
                type="number"
                step="0.01"
                required
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
              />
              <TextInput
                label="Ưu đãi app (%)"
                type="number"
                step="0.01"
                required
                value={formData.app_discount_percent}
                onChange={(e) => setFormData({ ...formData, app_discount_percent: e.target.value })}
              />
              <SelectInput
                label="Thanh toán"
                value={formData.settlement_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settlement_type: e.target.value as 'instant' | 'periodic',
                  })
                }
              >
                <option value="periodic">Định kỳ</option>
                <option value="instant">Tức thời</option>
              </SelectInput>
              <TextInput
                label="Chu kỳ (ngày)"
                type="number"
                min="1"
                max="31"
                value={formData.settlement_period_days}
                onChange={(e) =>
                  setFormData({ ...formData, settlement_period_days: e.target.value })
                }
              />
            </div>
            <TextInput
              label="iPOS store ID"
              value={formData.ipos_store_id}
              onChange={(e) => setFormData({ ...formData, ipos_store_id: e.target.value })}
            />
            <TextArea
              label="Giờ hoạt động (JSON)"
              value={formData.business_hours}
              onChange={(e) => setFormData({ ...formData, business_hours: e.target.value })}
            />
          </Section>
          <Section title="Hình ảnh">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ImageUploadField
                label="Logo"
                value={formData.logo_url}
                purpose="vendor_logo"
                helperText="Tải logo vendor lên server."
                onChange={(url) => setFormData({ ...formData, logo_url: url })}
                onUploadingChange={trackImageUploading}
              />
              <ImageUploadField
                label="Ảnh bìa"
                value={formData.cover_image_url}
                purpose="vendor_cover"
                helperText="Ảnh bìa hiển thị trên hồ sơ vendor."
                previewClassName="h-36 w-full object-cover"
                onChange={(url) => setFormData({ ...formData, cover_image_url: url })}
                onUploadingChange={trackImageUploading}
              />
            </div>
          </Section>
          {isEdit && (
            <Section title="Trạng thái onboarding">
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div className="flex-1">
                  <TextInput
                    label="Lý do từ chối"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <ActionButton disabled={statusLoading} onClick={() => changeStatus('active')}>
                    Kích hoạt
                  </ActionButton>
                  <ActionButton disabled={statusLoading} onClick={() => changeStatus('suspended')}>
                    Tạm dừng
                  </ActionButton>
                  <ActionButton
                    disabled={statusLoading}
                    danger
                    onClick={() => changeStatus('rejected')}
                  >
                    Từ chối
                  </ActionButton>
                </div>
              </div>
            </Section>
          )}
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
              disabled={loading || imageUploading}
              className="px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-primary hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {imageUploading ? 'Đang tải ảnh...' : loading ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </div>
        </form>
        {vendor && (
          <div className="p-6 border-t border-outline-variant/15">
            <ServiceManager
              vendorId={vendor.id}
              onChanged={() => {
                qc.invalidateQueries({ queryKey: ['vendor-services', vendor.id] })
                onSuccess()
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function ServiceManager({ vendorId, onChanged }: { vendorId: string; onChanged: () => void }) {
  const [editingService, setEditingService] = useState<VendorService | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['vendor-services', vendorId],
    queryFn: () => serviceApi.listByVendor(vendorId),
  })
  const { data: categoriesData } = useQuery({
    queryKey: ['service-categories'],
    queryFn: serviceApi.categories,
  })
  const services = ((servicesData as ServiceListResponse | undefined)?.data?.services ||
    []) as VendorService[]
  const categories = ((categoriesData as CategoryResponse | undefined)?.data?.categories ||
    []) as ServiceCategory[]

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-display font-bold text-on-surface">Dịch vụ của vendor</h3>
          <p className="text-xs text-on-surface-variant">
            Tạo, sửa ảnh/giá và tạm ẩn dịch vụ trong onboarding.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingService(null)
            setIsCreating(true)
          }}
          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium"
        >
          + Thêm dịch vụ
        </button>
      </div>
      {isLoading ? (
        <p className="text-sm text-on-surface-variant">Đang tải dịch vụ...</p>
      ) : services.length === 0 ? (
        <div className="rounded-xl bg-surface p-4 text-sm text-on-surface-variant">
          Vendor chưa có dịch vụ nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="rounded-xl border border-outline-variant/15 p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-on-surface">{service.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {service.discountPrice || service.originalPrice} VND
                  </p>
                </div>
                <span className="text-xs rounded-full bg-surface-high px-2 py-1">
                  {service.isActive ? 'Đang bật' : 'Đang ẩn'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingService(service)}
                  className="px-3 py-1.5 rounded-lg bg-surface-high text-xs font-medium"
                >
                  Sửa
                </button>
                <DeleteServiceButton serviceId={service.id} onChanged={onChanged} />
              </div>
            </div>
          ))}
        </div>
      )}
      {(isCreating || editingService) && (
        <ServiceForm
          vendorId={vendorId}
          service={editingService}
          categories={categories}
          onClose={() => {
            setEditingService(null)
            setIsCreating(false)
          }}
          onChanged={onChanged}
        />
      )}
    </section>
  )
}

function ServiceForm({
  vendorId,
  service,
  categories,
  onClose,
  onChanged,
}: {
  vendorId: string
  service: VendorService | null
  categories: ServiceCategory[]
  onClose: () => void
  onChanged: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: service?.name || '',
    slug: service?.slug || '',
    category_id: service?.categoryId || categories[0]?.id || '',
    description: service?.description || '',
    original_price: service?.originalPrice || '',
    discount_price: service?.discountPrice || '',
    discount_percent: service?.discountPercent || '',
    fulfillment_type: service?.fulfillmentType || 'fixed_price',
    reservation_discount_percent: service?.reservationDiscountPercent || '',
    duration_minutes: service?.durationMinutes ? String(service.durationMinutes) : '',
    max_quantity_per_order: service?.maxQuantityPerOrder
      ? String(service.maxQuantityPerOrder)
      : '10',
    images: (service?.images || []).join('\n'),
    is_active: service?.isActive ?? true,
    sort_order: String(service?.sortOrder || 0),
  })
  const imageUrls = formData.images
    .split('\n')
    .map((url) => url.trim())
    .filter(Boolean)
  const setImageUrls = (urls: string[]) => {
    setFormData((current) => ({ ...current, images: urls.join('\n') }))
  }
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (imageUploading) {
      setError('Vui lòng chờ ảnh tải lên xong trước khi lưu.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = {
        name: formData.name,
        slug: formData.slug,
        category_id: formData.category_id,
        description: emptyToUndefined(formData.description),
        original_price: formData.original_price,
        discount_price: emptyToUndefined(formData.discount_price),
        discount_percent: emptyToUndefined(formData.discount_percent),
        fulfillment_type: formData.fulfillment_type,
        reservation_discount_percent: emptyToUndefined(formData.reservation_discount_percent),
        duration_minutes: formData.duration_minutes ? Number(formData.duration_minutes) : undefined,
        max_quantity_per_order: formData.max_quantity_per_order
          ? Number(formData.max_quantity_per_order)
          : undefined,
        images: imageUrls,
        is_active: formData.is_active,
        sort_order: Number(formData.sort_order),
      }
      if (service) await serviceApi.adminUpdate(service.id, payload)
      else await serviceApi.adminCreate(vendorId, payload)
      onChanged()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }
  return (
    <form onSubmit={submit} className="rounded-2xl bg-surface p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-on-surface">
          {service ? 'Sửa dịch vụ' : 'Thêm dịch vụ onboarding'}
        </h4>
        <button type="button" onClick={onClose} className="text-sm text-on-surface-variant">
          Đóng
        </button>
      </div>
      {error && (
        <div className="bg-error/10 text-error p-3 rounded-xl text-sm font-medium">{error}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput
          label="Tên dịch vụ"
          required
          value={formData.name}
          onChange={(e) => {
            const name = e.target.value
            setFormData({ ...formData, name, slug: service ? formData.slug : slugify(name) })
          }}
        />
        <TextInput
          label="Slug"
          required
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
        />
        <SelectInput
          label="Danh mục"
          value={formData.category_id}
          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
        >
          <option value="">Chọn danh mục</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </SelectInput>
        <SelectInput
          label="Loại dịch vụ"
          value={formData.fulfillment_type}
          onChange={(e) =>
            setFormData({
              ...formData,
              fulfillment_type: e.target.value as 'fixed_price' | 'reservation',
            })
          }
        >
          <option value="fixed_price">Giá cố định</option>
          <option value="reservation">Đặt chỗ</option>
        </SelectInput>
        <TextInput
          label="Giá gốc"
          required
          value={formData.original_price}
          onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
        />
        <TextInput
          label="Giá giảm"
          value={formData.discount_price}
          onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
        />
        <TextInput
          label="% giảm"
          value={formData.discount_percent}
          onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
        />
        <TextInput
          label="% ưu đãi reservation"
          value={formData.reservation_discount_percent}
          onChange={(e) =>
            setFormData({ ...formData, reservation_discount_percent: e.target.value })
          }
        />
        <TextInput
          label="Thời lượng (phút)"
          type="number"
          value={formData.duration_minutes}
          onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
        />
        <TextInput
          label="Số lượng tối đa"
          type="number"
          value={formData.max_quantity_per_order}
          onChange={(e) => setFormData({ ...formData, max_quantity_per_order: e.target.value })}
        />
      </div>
      <TextArea
        label="Mô tả"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
      <MultiImageUploadField
        label="Ảnh dịch vụ"
        value={imageUrls}
        purpose="service_image"
        helperText="Tải một hoặc nhiều ảnh dịch vụ lên server."
        onChange={setImageUrls}
        onUploadingChange={setImageUploading}
      />
      <label className="flex items-center gap-2 text-sm text-on-surface">
        <input
          type="checkbox"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
        />
        Hiển thị dịch vụ
      </label>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-white text-sm font-medium"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={loading || imageUploading}
          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50"
        >
          {imageUploading ? 'Đang tải ảnh...' : loading ? 'Đang lưu...' : 'Lưu dịch vụ'}
        </button>
      </div>
    </form>
  )
}

function DeleteServiceButton({
  serviceId,
  onChanged,
}: {
  serviceId: string
  onChanged: () => void
}) {
  const [loading, setLoading] = useState(false)
  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true)
        try {
          await serviceApi.adminDelete(serviceId)
          onChanged()
        } finally {
          setLoading(false)
        }
      }}
      className="px-3 py-1.5 rounded-lg bg-error/10 text-error text-xs font-medium disabled:opacity-50"
    >
      Xóa
    </button>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl p-3 md:p-4 text-center">
      <p className="text-lg md:text-2xl font-display font-bold text-on-surface">{value}</p>
      <p className="text-xs text-on-surface-variant mt-1">{label}</p>
    </div>
  )
}

function TableHead({
  children,
  align = 'left',
}: {
  children: ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <th
      className={`px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      {children}
    </th>
  )
}

function VendorMenu({
  v,
  onApprove,
  onSuspend,
  approveDisabled,
  suspendDisabled,
  onEdit,
}: {
  v: AdminVendor
  onApprove: () => void
  onSuspend: () => void
  approveDisabled: boolean
  suspendDisabled: boolean
  onEdit: () => void
}) {
  return (
    <div className="flex justify-end gap-2 items-center">
      <button
        type="button"
        onClick={onEdit}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-high text-on-surface hover:opacity-90 transition-opacity"
      >
        Sửa
      </button>
      {(v.status === 'pending' || v.status === 'rejected' || v.status === 'suspended') && (
        <button
          type="button"
          onClick={onApprove}
          disabled={approveDisabled}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Kích hoạt
        </button>
      )}
      {v.status === 'active' && (
        <button
          type="button"
          onClick={onSuspend}
          disabled={suspendDisabled}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-error text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Tạm dừng
        </button>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: VendorStatus }) {
  const styles: Record<VendorStatus, string> = {
    active: 'bg-primary-fixed/30 text-primary',
    pending: 'bg-tertiary-fixed/50 text-tertiary',
    suspended: 'bg-error/10 text-error',
    rejected: 'bg-error/10 text-error',
  }
  const labels: Record<VendorStatus, string> = {
    active: 'Hoạt động',
    pending: 'Chờ duyệt',
    suspended: 'Tạm dừng',
    rejected: 'Từ chối',
  }
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-outline-variant/15 p-4">
      <h3 className="text-sm font-display font-bold text-on-surface">{title}</h3>
      {children}
    </section>
  )
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...inputProps } = props
  return (
    <label className="block">
      <span className="block text-sm font-medium text-on-surface mb-1.5">{label}</span>
      <input {...inputProps} className={inputClass} />
    </label>
  )
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const { label, ...textareaProps } = props
  return (
    <label className="block">
      <span className="block text-sm font-medium text-on-surface mb-1.5">{label}</span>
      <textarea {...textareaProps} className={`${inputClass} min-h-[100px]`} />
    </label>
  )
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const { label, children, ...selectProps } = props
  return (
    <label className="block">
      <span className="block text-sm font-medium text-on-surface mb-1.5">{label}</span>
      <select {...selectProps} className={inputClass}>
        {children}
      </select>
    </label>
  )
}

function ActionButton({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50 ${danger ? 'bg-error' : 'bg-primary'}`}
    >
      {children}
    </button>
  )
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function emptyToUndefined(value: string) {
  return value.trim() ? value.trim() : undefined
}

function formatBusinessHours(value: Record<string, unknown> | null | undefined) {
  return value ? JSON.stringify(value, null, 2) : ''
}

function parseJsonField(value: string) {
  if (!value.trim()) return undefined
  return JSON.parse(value)
}
