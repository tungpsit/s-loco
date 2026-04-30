import { createReservationSchema, updateVendorSchema } from '@S-Loco/shared/validators'
import { describe, expect, test } from 'bun:test'

describe('reservation validators', () => {
  test('accepts a minimal reservation request', () => {
    const parsed = createReservationSchema.parse({
      service_id: '11111111-1111-4111-8111-111111111111',
      party_size: 4,
      requested_time: '2026-05-01T12:00:00.000Z',
      customer_note: 'Bàn gần cửa sổ',
    })

    expect(parsed.party_size).toBe(4)
  })

  test('rejects invalid party size', () => {
    expect(() =>
      createReservationSchema.parse({
        service_id: '11111111-1111-4111-8111-111111111111',
        party_size: 0,
        requested_time: '2026-05-01T12:00:00.000Z',
      }),
    ).toThrow()
  })
})

describe('vendor iPos config validator', () => {
  test('trims iPos store id', () => {
    const parsed = updateVendorSchema.parse({ ipos_store_id: ' store-1 ' })

    expect(parsed.ipos_store_id).toBe('store-1')
  })
})
