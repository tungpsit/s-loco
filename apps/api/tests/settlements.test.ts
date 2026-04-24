import { describe, expect, test } from 'bun:test'
import { request, vendorLogin } from './helpers'

describe('Settlements', () => {
  describe('Auth Required', () => {
    test('GET /settlements/vendor — rejects unauthenticated', async () => {
      const { status } = await request('/api/v1/settlements/vendor')
      expect(status).toBe(401)
    })

    test('GET /settlements/admin — rejects unauthenticated', async () => {
      const { status } = await request('/api/v1/settlements/admin')
      expect(status).toBe(401)
    })

    test('POST /settlements/batch — rejects unauthenticated', async () => {
      const { status } = await request('/api/v1/settlements/batch', { method: 'POST' })
      expect(status).toBe(401)
    })

    test('POST /settlements/:id/approve — rejects unauthenticated', async () => {
      const { status } = await request('/api/v1/settlements/fake-id/approve', { method: 'POST' })
      expect(status).toBe(401)
    })

    test('POST /settlements/:id/disburse — rejects unauthenticated', async () => {
      const { status } = await request('/api/v1/settlements/fake-id/disburse', { method: 'POST' })
      expect(status).toBe(401)
    })

    test('GET /settlements/:id — vendor owner reaches settlement detail route', async () => {
      const token = await vendorLogin()
      expect(token).toBeTruthy()

      const { status, data } = await request('/api/v1/settlements/not-a-settlement', { token })

      expect(status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
    })
  })
})

describe('Dashboard', () => {
  describe('Auth Required', () => {
    test('GET /dashboard/admin — rejects unauthenticated', async () => {
      const { status } = await request('/api/v1/dashboard/admin')
      expect(status).toBe(401)
    })

    test('GET /dashboard/vendor — rejects unauthenticated', async () => {
      const { status } = await request('/api/v1/dashboard/vendor')
      expect(status).toBe(401)
    })
  })
})

describe('Content (Public)', () => {
  test('GET /content/articles — returns articles listing', async () => {
    const { status, data } = await request('/api/v1/content/articles')
    expect(status).toBe(200)
    expect(data.success).toBe(true)
  })

  test('GET /content/weather — returns weather data', async () => {
    const { status, data } = await request('/api/v1/content/weather')
    expect(status).toBe(200)
    expect(data.success).toBe(true)
  })

  test('GET /content/events — returns events listing', async () => {
    const { status, data } = await request('/api/v1/content/events')
    expect(status).toBe(200)
    expect(data.success).toBe(true)
  })

  test('POST /content/articles — rejects unauthenticated', async () => {
    const { status } = await request('/api/v1/content/articles', {
      method: 'POST',
      json: { title: 'Test', slug: 'test', category: 'news' },
    })
    expect(status).toBe(401)
  })
})

describe('Reviews (Public)', () => {
  test('GET /reviews/:vendorId — returns reviews listing', async () => {
    const { status, data } = await request('/api/v1/reviews/fake-vendor-id')
    expect(status).toBe(200)
    expect(data.success).toBe(true)
  })

  test('POST /reviews — rejects unauthenticated', async () => {
    const { status } = await request('/api/v1/reviews', {
      method: 'POST',
      json: { vendor_id: 'fake', rating: 5, comment: 'Great' },
    })
    expect(status).toBe(401)
  })
})

describe('Health Check', () => {
  test('GET /health — returns ok', async () => {
    const { status, data } = await request('/health')
    expect(status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.version).toBe('1.0.0')
  })
})
