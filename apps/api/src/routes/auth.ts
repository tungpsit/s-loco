import {
  loginSchema,
  refreshTokenSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from '@S-Loco/shared/validators'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { authRateLimit, otpRateLimit } from '../middleware/rate-limit'
import {
  AuthError,
  getProfile,
  loginWithEmail,
  registerOrLoginWithOtp,
} from '../services/auth.service'
import { OtpError, sendOtp } from '../services/otp.service'
import { refreshTokens, revokeAllSessions, TokenError } from '../services/token.service'

const auth = new Hono()

// ─── POST /auth/otp/send ───────────────────────────────
auth.post(
  '/otp/send',
  otpRateLimit((c) => c.req.header('x-phone') || 'unknown'),
  zValidator('json', sendOtpSchema),
  async (c) => {
    try {
      const { phone } = c.req.valid('json')
      const result = await sendOtp(phone)
      return c.json({ success: true, data: result })
    } catch (err) {
      if (err instanceof OtpError) {
        const status = err.code === 'RATE_LIMITED' ? 429 : 400
        return c.json({ success: false, error: { code: err.code, message: err.message } }, status)
      }
      throw err
    }
  },
)

// ─── POST /auth/otp/verify ─────────────────────────────
auth.post('/otp/verify', authRateLimit, zValidator('json', verifyOtpSchema), async (c) => {
  try {
    const body = c.req.valid('json')
    const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip')
    const result = await registerOrLoginWithOtp(
      body.phone,
      body.code,
      { full_name: body.full_name, email: body.email },
      body.device_info as Record<string, unknown>,
      ipAddress,
    )
    return c.json({ success: true, data: result })
  } catch (err) {
    if (err instanceof OtpError || err instanceof AuthError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
    }
    throw err
  }
})

// ─── POST /auth/login ──────────────────────────────────
auth.post('/login', authRateLimit, zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json')
    const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip')
    const result = await loginWithEmail(email, password, undefined, ipAddress)
    return c.json({ success: true, data: result })
  } catch (err) {
    if (err instanceof AuthError) {
      const status = err.code === 'INVALID_CREDENTIALS' ? 401 : 400
      return c.json({ success: false, error: { code: err.code, message: err.message } }, status)
    }
    throw err
  }
})

// ─── POST /auth/refresh ────────────────────────────────
auth.post('/refresh', zValidator('json', refreshTokenSchema), async (c) => {
  try {
    const { refresh_token } = c.req.valid('json')
    const result = await refreshTokens(refresh_token)
    return c.json({ success: true, data: result })
  } catch (err) {
    if (err instanceof TokenError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 401)
    }
    throw err
  }
})

// ─── POST /auth/logout ─────────────────────────────────
auth.post('/logout', authMiddleware(), async (c) => {
  const userId = c.get('userId')
  if (userId) {
    // Revoke all sessions for this user (simple approach)
    // In production, track sessionId in JWT or context for precise revocation
    await revokeAllSessions(userId)
  }
  return c.json({ success: true, data: { message: 'Đã đăng xuất.' } })
})

// ─── GET /auth/me ──────────────────────────────────────
auth.get('/me', authMiddleware(), async (c) => {
  try {
    const userId = c.get('userId')
    const user = await getProfile(userId!)
    return c.json({ success: true, data: { user } })
  } catch (err) {
    if (err instanceof AuthError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 404)
    }
    throw err
  }
})

export default auth
