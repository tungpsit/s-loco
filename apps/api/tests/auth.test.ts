import { describe, expect, test } from 'bun:test'
import { randomPhone, request } from './helpers'

describe('Auth Flow', () => {
  // ─── OTP ───
  describe('OTP', () => {
    test('POST /auth/otp/send — sends OTP to valid phone', async () => {
      const { status, data } = await request('/api/v1/auth/otp/send', {
        method: 'POST',
        json: { phone: randomPhone() },
      })
      expect(status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.expires_in).toBeGreaterThan(0)
    })

    test('POST /auth/otp/send — rejects invalid phone format', async () => {
      const { status, data } = await request('/api/v1/auth/otp/send', {
        method: 'POST',
        json: { phone: '123' },
      })
      expect(status).toBe(400)
    })

    test('POST /auth/otp/verify — rejects wrong code', async () => {
      const phone = randomPhone()
      await request('/api/v1/auth/otp/send', { method: 'POST', json: { phone } })
      const { status, data } = await request('/api/v1/auth/otp/verify', {
        method: 'POST',
        json: { phone, code: '000000' },
      })
      // Should fail with invalid OTP
      expect([400, 401]).toContain(status)
      expect(data.success).toBe(false)
    })
  })

  // ─── Email Login ───
  describe('Email Login', () => {
    test('POST /auth/login — rejects wrong credentials', async () => {
      const { status, data } = await request('/api/v1/auth/login', {
        method: 'POST',
        json: { email: 'nonexistent@test.com', password: 'wrongpass' },
      })
      expect([400, 401]).toContain(status)
      expect(data.success).toBe(false)
    })

    test('POST /auth/login — rejects missing fields', async () => {
      const { status } = await request('/api/v1/auth/login', {
        method: 'POST',
        json: { email: 'test@test.com' },
      })
      expect(status).toBe(400)
    })
  })

  // ─── Protected Routes ───
  describe('Protected Routes', () => {
    test('GET /auth/me — rejects unauthenticated request', async () => {
      const { status, data } = await request('/api/v1/auth/me')
      expect(status).toBe(401)
      expect(data.success).toBe(false)
    })

    test('GET /auth/me — rejects invalid token', async () => {
      const { status } = await request('/api/v1/auth/me', { token: 'invalid.jwt.token' })
      expect(status).toBe(401)
    })
  })

  // ─── Token Refresh ───
  describe('Token Refresh', () => {
    test('POST /auth/refresh — rejects invalid refresh token', async () => {
      const { status, data } = await request('/api/v1/auth/refresh', {
        method: 'POST',
        json: { refresh_token: 'invalid-token' },
      })
      expect(status).toBe(401)
      expect(data.success).toBe(false)
    })
  })
})
