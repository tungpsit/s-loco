import { describe, expect, test } from 'bun:test'
import {
  toReservationDiscountVoucherDto,
  toReservationDto,
} from '../src/services/reservation.service'
import { toIposWebhookEventDto } from '../src/services/ipos-webhook.service'

const now = new Date('2026-05-01T12:00:00.000Z')

describe('reservation API formatters', () => {
  test('formats reservation fields as snake_case API data', () => {
    const formatted = toReservationDto({
      id: 'reservation-1',
      userId: 'user-1',
      vendorId: 'vendor-1',
      serviceId: 'service-1',
      customerName: 'Nguyen Van A',
      customerPhone: '0900000000',
      partySize: 4,
      requestedTime: now,
      customerNote: 'Ban gan cua so',
      status: 'requested',
      confirmedAt: null,
      rejectedAt: null,
      cancelledAt: null,
      usedAt: null,
      settledAt: null,
      createdAt: now,
      updatedAt: now,
    })

    expect(formatted.customer_name).toBe('Nguyen Van A')
    expect(formatted.customer_phone).toBe('0900000000')
    expect(formatted.party_size).toBe(4)
    expect(formatted.requested_time).toBe(now.toISOString())
    expect('customerName' in formatted).toBe(false)
    expect('requestedTime' in formatted).toBe(false)
  })

  test('formats reservation voucher iPos fields as snake_case API data', () => {
    const formatted = toReservationDiscountVoucherDto({
      id: 'voucher-1',
      reservationId: 'reservation-1',
      vendorId: 'vendor-1',
      userId: 'user-1',
      discountPercent: '10.00',
      iposVoucherCode: 'IPOS-1',
      iposVoucherId: 'ipos-voucher-1',
      status: 'active',
      issueAttemptCount: 1,
      issueError: null,
      rawIssueResponse: null,
      usedAt: null,
      billAmount: null,
      discountAmount: null,
      commissionAmount: null,
      iposTransactionId: null,
      rawUsedWebhook: null,
      createdAt: now,
      updatedAt: now,
    })

    expect(formatted?.discount_percent).toBe('10.00')
    expect(formatted?.ipos_voucher_code).toBe('IPOS-1')
    expect(formatted?.issue_attempt_count).toBe(1)
    expect('iposVoucherCode' in formatted!).toBe(false)
  })

  test('formats iPos webhook event fields as snake_case API data', () => {
    const formatted = toIposWebhookEventDto({
      id: 'event-1',
      eventType: 'voucher.used',
      idempotencyKey: 'ipos:txn-1',
      reservationVoucherId: 'voucher-1',
      iposVoucherCode: 'IPOS-1',
      iposTransactionId: 'txn-1',
      payload: { event: 'voucher.used' },
      processedAt: now,
      processingError: null,
      createdAt: now,
    })

    expect(formatted.event_type).toBe('voucher.used')
    expect(formatted.idempotency_key).toBe('ipos:txn-1')
    expect(formatted.ipos_voucher_code).toBe('IPOS-1')
    expect(formatted.processed_at).toBe(now.toISOString())
    expect('eventType' in formatted).toBe(false)
  })
})
