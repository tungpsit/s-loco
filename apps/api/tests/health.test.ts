import { describe, expect, test } from 'bun:test'
import { request } from './helpers'

describe('Health Check', () => {
  test('GET /health returns 200 with ok status', async () => {
    const { status, data } = await request('/health')
    expect(status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.version).toBeDefined()
    expect(data.timestamp).toBeDefined()
  })

  test('GET /health — response shape is stable', async () => {
    const { data } = await request('/health')
    expect(typeof data.timestamp).toBe('string')
    expect(new Date(data.timestamp).toString()).not.toBe('Invalid Date')
  })

  test('GET /docs returns HTML', async () => {
    const res = await fetch('http://localhost:3000/docs')
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('api-reference')
  })
})
