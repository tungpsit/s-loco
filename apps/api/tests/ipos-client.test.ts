import { describe, expect, test } from 'bun:test'
import { createHmac } from 'node:crypto'
import {
  createIposDiscountVoucher,
  normalizeIposWebhookPayload,
  verifyIposWebhookSignature,
} from '../src/services/ipos-client'

describe('iPos client', () => {
  test('dry-run create voucher returns deterministic code', async () => {
    process.env.IPOS_DRY_RUN = 'true'
    const result = await createIposDiscountVoucher({
      reservationId: '11111111-1111-4111-8111-111111111111',
      vendorId: '22222222-2222-4222-8222-222222222222',
      serviceName: 'Đặt bàn nhà hàng',
      discountPercent: '5.00',
      customerPhone: '0901234567',
      requestedTime: new Date('2026-05-01T12:00:00.000Z'),
      iposStoreId: 'store-1',
    })

    expect(result.code).toBe('SL-11111111')
    expect(result.raw.dry_run).toBe(true)
  })

  test('verifies sha256 webhook signature', async () => {
    const rawBody = JSON.stringify({ voucherCode: 'ABC' })
    const secret = 'secret'
    const signature = createHmac('sha256', secret).update(rawBody).digest('hex')

    expect(await verifyIposWebhookSignature(rawBody, signature, secret)).toBe(true)
    expect(await verifyIposWebhookSignature(rawBody, 'bad', secret)).toBe(false)
  })

  test('normalizes flexible iPos webhook payload', () => {
    const normalized = normalizeIposWebhookPayload({
      event: 'voucher.used',
      voucherCode: 'IPOS-123',
      transactionId: 'TXN-1',
      billAmount: 1000000,
      discountAmount: 50000,
    })

    expect(normalized.eventType).toBe('voucher.used')
    expect(normalized.voucherCode).toBe('IPOS-123')
    expect(normalized.transactionId).toBe('TXN-1')
    expect(normalized.billAmount).toBe('1000000')
    expect(normalized.discountAmount).toBe('50000')
  })
})
