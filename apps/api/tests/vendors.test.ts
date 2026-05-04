import { serviceCategories, users } from '@S-Loco/db/schema'
import { describe, expect, test } from 'bun:test'
import { getDb } from '../src/db'
import { adminLogin, randomPhone, request, vendorLogin } from './helpers'

describe('Vendor & Service Management', () => {
  // ─── Public Endpoints ───
  describe('Public', () => {
    test('GET /services — returns service listing', async () => {
      const { status, data } = await request('/api/v1/services')
      expect(status).toBe(200)
      expect(data.success).toBe(true)
      // May be empty but should have the response shape
      expect(data.data).toBeDefined()
    })

    test('GET /services — supports pagination', async () => {
      const { status, data } = await request('/api/v1/services?page=1&limit=5')
      expect(status).toBe(200)
      expect(data.success).toBe(true)
    })

    test('GET /services — supports category filter', async () => {
      const { status, data } = await request('/api/v1/services?category=food')
      expect(status).toBe(200)
      expect(data.success).toBe(true)
    })

    test('GET /services/search — search by keyword', async () => {
      const { status, data } = await request('/api/v1/services/search?q=biển')
      expect(status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  // ─── Vendor Endpoints (require auth) ───
  describe('Vendor Auth Required', () => {
    test('POST /vendors — rejects unauthenticated', async () => {
      const { status } = await request('/api/v1/vendors', {
        method: 'POST',
        json: { name: 'Test Vendor', phone: '0901234567' },
      })
      expect(status).toBe(401)
    })

    test('GET /vendors/me — vendor owner gets own vendor profile', async () => {
      const token = await vendorLogin()
      if (!token) return

      const { status, data } = await request('/api/v1/vendors/me', { token })

      expect(status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.vendor.id).toBeTruthy()
      expect(data.data.vendor.ownerId).toBeTruthy()
    })
  })

  // ─── Admin Endpoints ───
  describe('Admin Auth Required', () => {
    test('GET /admin/vendors — rejects unauthenticated', async () => {
      const { status } = await request('/api/v1/admin/vendors')
      expect(status).toBe(401)
    })

    test('PUT /admin/vendors/:id/status — rejects unauthenticated', async () => {
      const { status } = await request('/api/v1/admin/vendors/fake-id/status', {
        method: 'PUT',
        json: { status: 'active' },
      })
      expect(status).toBe(401)
    })
  })

  describe('Admin onboarding', () => {
    test('PUT /admin/vendors/:id — updates onboarding fields', async () => {
      const token = await adminLogin()
      const ownerId = await createVendorOwner('onboarding-fields')
      const created = await request('/api/v1/admin/vendors', {
        method: 'POST',
        token,
        json: {
          owner_id: ownerId,
          name: 'Onboarding Test Vendor',
          slug: `onboarding-test-vendor-${crypto.randomUUID().slice(0, 8)}`,
          latitude: '19.7451234',
          longitude: '105.9012345',
        },
      })
      expect(created.status).toBe(201)

      const vendorId = created.data.data.vendor.id
      const updated = await request(`/api/v1/admin/vendors/${vendorId}`, {
        method: 'PUT',
        token,
        json: {
          name: 'Onboarding Test Vendor Updated',
          description: 'Admin hỗ trợ cập nhật hồ sơ onboarding.',
          address: '10 Hồ Xuân Hương',
          phone: '0901234567',
          email: 'vendor-onboarding@example.com',
          latitude: '19.7460000',
          longitude: '105.9020000',
          commission_rate: '9.50',
          app_discount_percent: '4.50',
          business_hours: { mon: ['08:00', '17:00'] },
          ipos_store_id: 'IPOS-ONBOARD-1',
          logo_url: 'https://cdn.example.com/vendors/logo.jpg',
          cover_image_url: 'https://cdn.example.com/vendors/cover.jpg',
          settlement_type: 'instant',
          settlement_period_days: 1,
        },
      })

      expect(updated.status).toBe(200)
      expect(updated.data.data.vendor).toMatchObject({
        name: 'Onboarding Test Vendor Updated',
        address: '10 Hồ Xuân Hương',
        phone: '0901234567',
        email: 'vendor-onboarding@example.com',
        commissionRate: '9.50',
        appDiscountPercent: '4.50',
        logoUrl: 'https://cdn.example.com/vendors/logo.jpg',
        coverImageUrl: 'https://cdn.example.com/vendors/cover.jpg',
        settlementType: 'instant',
        settlementPeriodDays: 1,
      })
      expect(updated.data.data.vendor.businessHours).toEqual({ mon: ['08:00', '17:00'] })
      expect(updated.data.data.vendor.metadata).toMatchObject({ ipos_store_id: 'IPOS-ONBOARD-1' })
    })

    test('PUT /admin/vendors/:id/status — rejects vendor with reason', async () => {
      const token = await adminLogin()
      const ownerId = await createVendorOwner('reject-status')
      const created = await request('/api/v1/admin/vendors', {
        method: 'POST',
        token,
        json: {
          owner_id: ownerId,
          name: 'Reject Status Vendor',
          slug: `reject-status-vendor-${crypto.randomUUID().slice(0, 8)}`,
          latitude: '19.7451234',
          longitude: '105.9012345',
        },
      })
      expect(created.status).toBe(201)

      const vendorId = created.data.data.vendor.id
      const rejected = await request(`/api/v1/admin/vendors/${vendorId}/status`, {
        method: 'PUT',
        token,
        json: {
          status: 'rejected',
          rejection_reason: 'Thiếu giấy phép kinh doanh.',
        },
      })

      expect(rejected.status).toBe(200)
      expect(rejected.data.data.vendor).toMatchObject({
        status: 'rejected',
        rejectionReason: 'Thiếu giấy phép kinh doanh.',
      })
    })

    test('admin can create, update, and delete services for vendor onboarding', async () => {
      const token = await adminLogin()
      const ownerId = await createVendorOwner('service-crud')
      const categoryId = await createServiceCategory('admin-service-crud')
      const createdVendor = await request('/api/v1/admin/vendors', {
        method: 'POST',
        token,
        json: {
          owner_id: ownerId,
          name: 'Admin Service Vendor',
          slug: `admin-service-vendor-${crypto.randomUUID().slice(0, 8)}`,
          latitude: '19.7451234',
          longitude: '105.9012345',
        },
      })
      expect(createdVendor.status).toBe(201)

      const vendorId = createdVendor.data.data.vendor.id
      const createdService = await request(`/api/v1/admin/vendors/${vendorId}/services`, {
        method: 'POST',
        token,
        json: {
          name: 'Set hải sản onboarding',
          slug: `set-hai-san-onboarding-${crypto.randomUUID().slice(0, 8)}`,
          category_id: categoryId,
          description: 'Dịch vụ do admin tạo trong onboarding.',
          original_price: '350000',
          discount_price: '299000',
          images: ['https://cdn.example.com/services/seafood.jpg'],
          duration_minutes: 90,
          max_quantity_per_order: 6,
        },
      })
      expect(createdService.status).toBe(201)
      expect(createdService.data.data.service.vendorId).toBe(vendorId)

      const serviceId = createdService.data.data.service.id
      const updatedService = await request(`/api/v1/admin/services/${serviceId}`, {
        method: 'PATCH',
        token,
        json: {
          name: 'Set hải sản onboarding cập nhật',
          discount_price: '279000',
          is_active: false,
          sort_order: 2,
        },
      })
      expect(updatedService.status).toBe(200)
      expect(updatedService.data.data.service).toMatchObject({
        name: 'Set hải sản onboarding cập nhật',
        discountPrice: '279000.00',
        isActive: false,
        sortOrder: 2,
      })

      const deletedService = await request(`/api/v1/admin/services/${serviceId}`, {
        method: 'DELETE',
        token,
      })
      expect(deletedService.status).toBe(200)
      expect(deletedService.data.success).toBe(true)
    })

    test('POST /admin/uploads — uploads an onboarding image and returns a public URL', async () => {
      const token = await adminLogin()
      const body = new FormData()
      body.set('purpose', 'vendor_logo')
      body.set('file', new Blob(['fake image'], { type: 'image/png' }), 'vendor-logo.png')

      const response = await fetch(
        new URL('/api/v1/admin/uploads', process.env.TEST_API_BASE_URL || 'http://localhost:3000'),
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body,
        },
      )
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.url).toMatch(/^https?:\/\//)
      expect(data.data.key).toContain('vendor_logo')
    })
  })

  describe('Vendor image URL restrictions', () => {
    test('vendor service creation rejects manually supplied external image URLs', async () => {
      const token = await vendorLogin()
      expect(token).toBeTruthy()

      const profile = await request('/api/v1/vendors/me', { token })
      expect(profile.status).toBe(200)
      const vendorId = profile.data.data.vendor.id
      const categoryId = await createServiceCategory('vendor-external-image')

      const created = await request(`/api/v1/services/vendor/${vendorId}`, {
        method: 'POST',
        token,
        json: {
          name: 'Vendor External Image Service',
          slug: `vendor-external-image-service-${crypto.randomUUID().slice(0, 8)}`,
          category_id: categoryId,
          original_price: '350000',
          images: ['https://example.com/manual.jpg'],
        },
      })

      expect(created.status).toBe(400)
      expect(created.data.success).toBe(false)
      expect(created.data.error.code).toBe('INVALID_IMAGE_URL')
    })

    test('vendor service creation accepts uploaded managed image URLs', async () => {
      const token = await vendorLogin()
      expect(token).toBeTruthy()

      const profile = await request('/api/v1/vendors/me', { token })
      expect(profile.status).toBe(200)
      const vendorId = profile.data.data.vendor.id
      const categoryId = await createServiceCategory('vendor-managed-image')

      const managedImageUrl = `${process.env.TEST_API_BASE_URL || 'http://localhost:3000'}/service_image/vendor-owner-id/uploaded.png`
      const created = await request(`/api/v1/services/vendor/${vendorId}`, {
        method: 'POST',
        token,
        json: {
          name: 'Vendor Managed Image Service',
          slug: `vendor-managed-image-service-${crypto.randomUUID().slice(0, 8)}`,
          category_id: categoryId,
          original_price: '350000',
          images: [managedImageUrl],
        },
      })

      expect(created.status).toBe(201)
      expect(created.data.success).toBe(true)
      expect(created.data.data.service.images).toEqual([managedImageUrl])
    })

    test('vendor combo creation rejects manually supplied external image URLs', async () => {
      const token = await vendorLogin()
      expect(token).toBeTruthy()

      const profile = await request('/api/v1/vendors/me', { token })
      expect(profile.status).toBe(200)
      const vendorId = profile.data.data.vendor.id
      const categoryId = await createServiceCategory('combo-external-image')
      const service = await createVendorService(
        token!,
        vendorId,
        categoryId,
        'combo-external-image',
      )

      const combo = await request('/api/v1/combos', {
        method: 'POST',
        token,
        json: {
          name: 'Combo external image',
          comboPrice: 250000,
          items: [{ serviceId: service.id, quantity: 1 }],
          images: ['https://example.com/combo.jpg'],
        },
      })

      expect(combo.status).toBe(400)
      expect(combo.data.success).toBe(false)
      expect(combo.data.error.code).toBe('INVALID_IMAGE_URL')
    })
  })
})

async function createVendorOwner(label: string) {
  const db = getDb()
  const [user] = await db
    .insert(users)
    .values({
      email: `vendor-owner-${label}-${crypto.randomUUID()}@example.com`,
      phone: randomPhone(),
      fullName: `Vendor Owner ${label}`,
      role: 'vendor_owner',
    })
    .returning()
  if (!user) throw new Error('Unable to create vendor owner')
  return user.id
}

async function createVendorService(
  token: string,
  vendorId: string,
  categoryId: string,
  label: string,
) {
  const service = await request(`/api/v1/services/vendor/${vendorId}`, {
    method: 'POST',
    token,
    json: {
      name: `Vendor Service ${label}`,
      slug: `vendor-service-${label}-${crypto.randomUUID().slice(0, 8)}`,
      category_id: categoryId,
      original_price: '350000',
    },
  })
  expect(service.status).toBe(201)
  return service.data.data.service
}

async function createServiceCategory(label: string) {
  const db = getDb()
  const [category] = await db
    .insert(serviceCategories)
    .values({
      name: `Admin Category ${label}`,
      slug: `admin-category-${label}-${crypto.randomUUID().slice(0, 8)}`,
      sortOrder: 999,
      isActive: true,
    })
    .returning()
  if (!category) throw new Error('Unable to create service category')
  return category.id
}
