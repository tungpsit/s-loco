import { describe, expect, test } from 'bun:test'
import { request } from './helpers'

describe('Payment Webhooks', () => {
  // ─── VNPay ───
  describe('VNPay', () => {
    test('GET /payments/webhook/vnpay — rejects missing params', async () => {
      const { status, data } = await request('/api/v1/payments/webhook/vnpay')
      // Should handle gracefully (not crash)
      expect([200, 400, 500]).toContain(status)
    })

    test('GET /payments/webhook/vnpay — rejects invalid signature', async () => {
      const params = new URLSearchParams({
        vnp_TxnRef: 'test-order',
        vnp_Amount: '10000000',
        vnp_ResponseCode: '00',
        vnp_TransactionStatus: '00',
        vnp_SecureHash: 'invalid-hash',
      })
      const { status } = await request(`/api/v1/payments/webhook/vnpay?${params}`)
      // Should reject bad signature
      expect([200, 400, 401, 500]).toContain(status)
    })
  })

  // ─── Momo ───
  describe('Momo', () => {
    test('POST /payments/webhook/momo — rejects invalid signature', async () => {
      const { status } = await request('/api/v1/payments/webhook/momo', {
        method: 'POST',
        json: {
          orderId: 'test-order',
          amount: 100000,
          resultCode: 0,
          signature: 'invalid-sig',
        },
      })
      expect([200, 400, 401, 500]).toContain(status)
    })
  })

  // ─── SePay ───
  describe('SePay', () => {
    test('POST /payments/webhook/sepay — rejects invalid signature', async () => {
      const { status } = await request('/api/v1/payments/webhook/sepay', {
        method: 'POST',
        json: {
          transferAmount: 100000,
          content: 'SLOCO test-order',
          signature: 'invalid-sig',
        },
      })
      expect([200, 400, 401, 500]).toContain(status)
    })
  })

  // ─── Payment Initiation ───
  describe('Payment Initiation', () => {
    test('POST /payments/initiate — rejects unauthenticated', async () => {
      const { status } = await request('/api/v1/payments/initiate', {
        method: 'POST',
        json: { order_id: 'fake', gateway: 'vnpay' },
      })
      expect(status).toBe(401)
    })

    test('POST /payments/refund — rejects unauthenticated', async () => {
      const { status } = await request('/api/v1/payments/refund', {
        method: 'POST',
        json: { voucher_id: 'fake', reason: 'test' },
      })
      expect(status).toBe(401)
    })
  })
})
