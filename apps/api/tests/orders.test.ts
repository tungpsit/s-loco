import { describe, expect, test } from 'bun:test'
import { request } from './helpers'

describe('Order Flow', () => {
  // ─── Auth Required ───
  describe('Auth Required', () => {
    test('POST /orders — rejects unauthenticated', async () => {
      const { status } = await request('/api/v1/orders', {
        method: 'POST',
        json: { items: [{ service_id: 'fake-id', quantity: 1 }] },
      })
      expect(status).toBe(401)
    })

    test('GET /orders — rejects unauthenticated', async () => {
      const { status } = await request('/api/v1/orders')
      expect(status).toBe(401)
    })

    test('POST /orders/:id/cancel — rejects unauthenticated', async () => {
      const { status } = await request('/api/v1/orders/fake-id/cancel', { method: 'POST' })
      expect(status).toBe(401)
    })
  })

  // ─── Validation ───
  describe('Validation', () => {
    test('POST /orders — rejects empty items array', async () => {
      const { status } = await request('/api/v1/orders', {
        method: 'POST',
        json: { items: [] },
        token: 'fake-token',
      })
      // Either 400 (validation) or 401 (fake token)
      expect([400, 401]).toContain(status)
    })
  })
})

describe('Voucher Flow', () => {
  // ─── Auth Required ───
  describe('Auth Required', () => {
    test('GET /vouchers — rejects unauthenticated', async () => {
      const { status } = await request('/api/v1/vouchers')
      expect(status).toBe(401)
    })

    test('POST /vouchers/redeem — rejects unauthenticated', async () => {
      const { status } = await request('/api/v1/vouchers/redeem', {
        method: 'POST',
        json: { qr_token: 'fake-token' },
      })
      expect(status).toBe(401)
    })

    test('POST /vouchers/self-redeem — rejects unauthenticated', async () => {
      const { status } = await request('/api/v1/vouchers/self-redeem', {
        method: 'POST',
        json: { voucher_id: 'fake-id', vendor_id: 'fake-id' },
      })
      expect(status).toBe(401)
    })
  })

  // ─── Voucher state machine (unit-like) ───
  describe('State Machine', () => {
    test('valid transitions are defined', async () => {
      const { canTransition } = await import('../src/services/voucher-state')
      // Valid transitions
      expect(canTransition('created', 'paid')).toBe(true)
      expect(canTransition('paid', 'redeemed')).toBe(true)
      expect(canTransition('redeemed', 'completed')).toBe(true)
      expect(canTransition('completed', 'settled')).toBe(true)
      // Invalid transitions
      expect(canTransition('created', 'completed')).toBe(false)
      expect(canTransition('settled', 'created')).toBe(false)
      expect(canTransition('expired', 'paid')).toBe(false)
      expect(canTransition('refunded', 'redeemed')).toBe(false)
      // Terminal states
      expect(canTransition('settled', 'anything' as any)).toBe(false)
      expect(canTransition('cancelled', 'anything' as any)).toBe(false)
    })
  })
})
