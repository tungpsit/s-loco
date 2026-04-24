import { getDb } from '../db'
import { users } from '@S-Loco/db/schema'
import { APP_CONSTANTS } from '@S-Loco/shared'
import { eq } from 'drizzle-orm'
import { verifyPassword } from '../lib/password'
import { verifyOtp } from './otp.service'
import { generateAccessToken, generateRefreshToken } from './token.service'

// ─── OTP Login (Tourist) ───────────────────────────────
export async function registerOrLoginWithOtp(
  phone: string,
  code: string,
  profile?: { full_name?: string; email?: string },
  deviceInfo?: Record<string, unknown>,
  ipAddress?: string,
) {
  // Verify OTP first
  // TODO: verify otp
  // await verifyOtp(phone, code)

  const db = getDb()

  // Find existing user or create new
  let [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1)

  if (!user) {
    // Create new tourist user
    const insertValues: Record<string, unknown> = {
      phone,
      role: 'tourist',
    }
    if (profile?.full_name) insertValues.fullName = profile.full_name
    if (profile?.email) insertValues.email = profile.email

    const [newUser] = await db
      .insert(users)
      .values(insertValues as any)
      .returning()
    user = newUser!
  }

  if (!user.isActive) {
    throw new AuthError('ACCOUNT_DISABLED', 'Tài khoản đã bị vô hiệu hóa.')
  }

  // Generate tokens
  const accessToken = await generateAccessToken({ id: user.id, role: user.role })
  const refreshToken = await generateRefreshToken(user.id, deviceInfo, ipAddress)

  return {
    user: sanitizeUser(user),
    tokens: {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer' as const,
      expires_in: APP_CONSTANTS.ACCESS_TOKEN_TTL_SECONDS,
    },
  }
}

// ─── Email/Password Login (Vendor/Admin) ───────────────
export async function loginWithEmail(
  email: string,
  password: string,
  deviceInfo?: Record<string, unknown>,
  ipAddress?: string,
) {
  const db = getDb()

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (!user) {
    throw new AuthError('INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.')
  }

  if (!user.isActive) {
    throw new AuthError('ACCOUNT_DISABLED', 'Tài khoản đã bị vô hiệu hóa.')
  }

  // Tourists can't use email login
  if (user.role === 'tourist') {
    throw new AuthError('INVALID_ROLE', 'Vui lòng sử dụng đăng nhập bằng số điện thoại.')
  }

  if (!user.passwordHash) {
    throw new AuthError('NO_PASSWORD', 'Tài khoản chưa được thiết lập mật khẩu.')
  }

  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) {
    throw new AuthError('INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.')
  }

  // Generate tokens
  const accessToken = await generateAccessToken({ id: user.id, role: user.role })
  const refreshToken = await generateRefreshToken(user.id, deviceInfo, ipAddress)

  return {
    user: sanitizeUser(user),
    tokens: {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer' as const,
      expires_in: APP_CONSTANTS.ACCESS_TOKEN_TTL_SECONDS,
    },
  }
}

// ─── Profile ───────────────────────────────────────────
export async function getProfile(userId: string) {
  const db = getDb()
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  if (!user) {
    throw new AuthError('USER_NOT_FOUND', 'Người dùng không tồn tại.')
  }

  return sanitizeUser(user)
}

// ─── Helpers ───────────────────────────────────────────
function sanitizeUser(user: typeof users.$inferSelect) {
  const { passwordHash, deletedAt, ...safe } = user
  return safe
}

// ─── Auth Error ────────────────────────────────────────
export class AuthError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'AuthError'
  }
}
