import { describe, expect, test } from 'bun:test'
import { loginSchema } from '@S-Loco/shared/validators'
import { users } from '@S-Loco/db/schema'
import { getDb } from '../src/db'
import { hashPassword } from '../src/lib/password'
import { loginWithEmail } from '../src/services/auth.service'
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
    test('POST /auth/login — allows vendor to login with phone number', async () => {
      const { phone } = await createPasswordTestUser('phone-login')

      const parsed = loginSchema.safeParse({ email: phone, password: 'oldpass123' })
      const data = await loginWithEmail(phone, 'oldpass123')

      expect(parsed.success).toBe(true)
      expect(data.user.role).toBe('vendor_owner')
      expect(data.tokens.access_token).toBeString()
    })

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

  // ─── Password Security ───────────────────────────────
  describe('Password Security', () => {
    test('POST /auth/change-password — rejects unauthenticated request', async () => {
      const { status, data } = await request('/api/v1/auth/change-password', {
        method: 'POST',
        json: { current_password: 'oldpass123', new_password: 'newpass123' },
      })
      expect(status).toBe(401)
      expect(data.success).toBe(false)
    })

    test('POST /auth/change-password — changes password with current password', async () => {
      const { email } = await createPasswordTestUser('change')
      const login = await request('/api/v1/auth/login', {
        method: 'POST',
        json: { email, password: 'oldpass123' },
      })
      const token = login.data.data.tokens.access_token

      const { status, data } = await request('/api/v1/auth/change-password', {
        method: 'POST',
        token,
        json: { current_password: 'oldpass123', new_password: 'newpass123' },
      })

      expect(status).toBe(200)
      expect(data.success).toBe(true)

      const oldLogin = await request('/api/v1/auth/login', {
        method: 'POST',
        json: { email, password: 'oldpass123' },
      })
      expect(oldLogin.status).toBe(401)

      const newLogin = await request('/api/v1/auth/login', {
        method: 'POST',
        json: { email, password: 'newpass123' },
      })
      expect(newLogin.status).toBe(200)
    })

    test('POST /auth/change-password — rejects wrong current password', async () => {
      const { email } = await createPasswordTestUser('wrong-current')
      const login = await request('/api/v1/auth/login', {
        method: 'POST',
        json: { email, password: 'oldpass123' },
      })
      const token = login.data.data.tokens.access_token

      const { status, data } = await request('/api/v1/auth/change-password', {
        method: 'POST',
        token,
        json: { current_password: 'wrongpass123', new_password: 'newpass123' },
      })

      expect(status).toBe(401)
      expect(data.success).toBe(false)
    })

    test('POST /auth/reset-password — returns temporary password and revokes refresh sessions', async () => {
      const { email } = await createPasswordTestUser('reset')
      const login = await request('/api/v1/auth/login', {
        method: 'POST',
        json: { email, password: 'oldpass123' },
      })
      const token = login.data.data.tokens.access_token
      const refreshToken = login.data.data.tokens.refresh_token

      const { status, data } = await request('/api/v1/auth/reset-password', {
        method: 'POST',
        token,
      })

      expect(status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.temporary_password).toBeString()
      expect(data.data.temporary_password.length).toBeGreaterThanOrEqual(12)

      const refresh = await request('/api/v1/auth/refresh', {
        method: 'POST',
        json: { refresh_token: refreshToken },
      })
      expect(refresh.status).toBe(401)

      const tempLogin = await request('/api/v1/auth/login', {
        method: 'POST',
        json: { email, password: data.data.temporary_password },
      })
      expect(tempLogin.status).toBe(200)
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

async function createPasswordTestUser(label: string) {
  const db = getDb()
  const email = `auth-${label}-${crypto.randomUUID()}@example.com`
  const phone = randomPhone()
  const passwordHash = await hashPassword('oldpass123')
  const [user] = await db
    .insert(users)
    .values({
      email,
      phone,
      fullName: 'Auth Test Vendor',
      role: 'vendor_owner',
      passwordHash,
    })
    .returning()

  if (!user) throw new Error('Unable to create test user')
  return { email, phone }
}
