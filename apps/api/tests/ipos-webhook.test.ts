import { describe, expect, test } from 'bun:test'
import { createHmac } from 'node:crypto'
import { request } from './helpers'

describe('iPos webhook API', () => {
  test('POST /webhooks/ipos rejects missing signature when secret configured', async () => {
    process.env.IPOS_WEBHOOK_SECRET = 'secret'
    const { status, data } = await request('/api/v1/webhooks/ipos', {
      method: 'POST',
      json: { event: 'voucher.used', voucherCode: 'UNKNOWN' },
    })

    expect(status).toBe(400)
    expect(data.success).toBe(false)
  })

  test('POST /webhooks/ipos stores unmapped signed event without crashing', async () => {
    process.env.IPOS_WEBHOOK_SECRET = 'secret'
    const payload = {
      event: 'voucher.used',
      voucherCode: `UNKNOWN-${Date.now()}`,
      transactionId: `TXN-${Date.now()}`,
    }
    const rawBody = JSON.stringify(payload)
    const signature = createHmac('sha256', 'secret').update(rawBody).digest('hex')

    const { status, data } = await request('/api/v1/webhooks/ipos', {
      method: 'POST',
      body: rawBody,
      headers: { 'x-ipos-signature': signature },
    })

    expect(status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('stored_with_error')
  })
})
