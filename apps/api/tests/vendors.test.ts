import { describe, expect, test } from 'bun:test'
import { request, vendorLogin } from './helpers'

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
      expect(token).toBeTruthy()

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
})
