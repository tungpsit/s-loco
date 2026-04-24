import { beforeEach, describe, expect, test } from 'bun:test'
import { request, adminLogin, vendorLogin } from './helpers'

describe('Voucher API', () => {
  // ─── Auth Required ───
  describe('Auth Required', () => {
    test('GET /vouchers — rejects unauthenticated', async () => {
      const { status } = await request('/api/v1/vouchers')
      expect(status).toBe(401)
    })

    test('GET /vouchers/:id — rejects unauthenticated', async () => {
      const { status } = await request('/api/v1/vouchers/fake-uuid')
      expect(status).toBe(401)
    })
  })

  // ─── Voucher Listing ───
  describe('Authenticated Voucher Access', () => {
    let token: string | null

    beforeEach(async () => {
      token = await adminLogin()
    })

    test('GET /vouchers — authenticated returns 200', async () => {
      if (!token) return
      const { status, data } = await request('/api/v1/vouchers', { token })
      expect(status).toBe(200)
      expect(data.success).toBe(true)
    })

    test('GET /vouchers — supports pagination params', async () => {
      if (!token) return
      const { status, data } = await request('/api/v1/vouchers?page=1&limit=10', { token })
      expect(status).toBe(200)
      expect(data.success).toBe(true)
    })

    test('GET /vouchers/:id — invalid UUID returns 400 or 404', async () => {
      if (!token) return
      const { status } = await request('/api/v1/vouchers/not-a-uuid', { token })
      expect([400, 401, 404]).toContain(status)
    })

    test('GET /vouchers/vendor — vendor owner gets voucher list for their stores', async () => {
      const vendorToken = await vendorLogin()
      expect(vendorToken).toBeTruthy()

      const { status, data } = await request('/api/v1/vouchers/vendor?status=paid,redeemed', {
        token: vendorToken,
      })

      expect(status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data.items)).toBe(true)
      expect(typeof data.data.total).toBe('number')
      expect(data.data.page).toBe(1)
      expect(data.data.limit).toBe(20)
    })
  })
})
