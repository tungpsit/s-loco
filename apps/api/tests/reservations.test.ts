import { describe, expect, test } from 'bun:test'
import { request, vendorLogin } from './helpers'

describe('Reservations API', () => {
  test('POST /reservations rejects unauthenticated', async () => {
    const { status } = await request('/api/v1/reservations', {
      method: 'POST',
      json: {
        service_id: '11111111-1111-4111-8111-111111111111',
        party_size: 2,
        requested_time: '2026-05-01T12:00:00.000Z',
      },
    })

    expect(status).toBe(401)
  })

  test('GET /reservations/vendor rejects unauthenticated', async () => {
    const { status } = await request('/api/v1/reservations/vendor')
    expect(status).toBe(401)
  })

  test('vendor reservation list route is mounted', async () => {
    const token = await vendorLogin()
    const { status, data } = await request('/api/v1/reservations/vendor', { token })
    expect(status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.items).toBeDefined()
  })
})
