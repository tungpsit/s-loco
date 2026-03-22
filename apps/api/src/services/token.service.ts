import { getDb } from '@s-local/db'
import { userSessions } from '@s-local/db/schema'
import { APP_CONSTANTS } from '@s-local/shared'
import { eq } from 'drizzle-orm'
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret')

// ─── Access Token ──────────────────────────────────────

export async function generateAccessToken(user: { id: string; role: string }) {
  return new SignJWT({ sub: user.id, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${APP_CONSTANTS.ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(JWT_SECRET)
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, JWT_SECRET)
  return { userId: payload.sub as string, role: payload.role as string }
}

// ─── Refresh Token ─────────────────────────────────────

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function generateRefreshToken(
  userId: string,
  deviceInfo?: Record<string, unknown>,
  ipAddress?: string,
) {
  const db = getDb()
  const rawToken = crypto.randomUUID()
  const tokenHash = await hashToken(rawToken)
  const expiresAt = new Date(Date.now() + APP_CONSTANTS.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)

  await db.insert(userSessions).values({
    userId,
    refreshTokenHash: tokenHash,
    deviceInfo: deviceInfo || null,
    ipAddress: ipAddress || null,
    expiresAt,
  })

  return rawToken
}

export async function refreshTokens(refreshToken: string) {
  const db = getDb()
  const tokenHash = await hashToken(refreshToken)

  // Find session by hash
  const [session] = await db
    .select()
    .from(userSessions)
    .where(eq(userSessions.refreshTokenHash, tokenHash))
    .limit(1)

  if (!session) {
    throw new TokenError('INVALID_REFRESH_TOKEN', 'Refresh token không hợp lệ.')
  }

  if (new Date() > session.expiresAt) {
    // Clean up expired session
    await db.delete(userSessions).where(eq(userSessions.id, session.id))
    throw new TokenError('EXPIRED_REFRESH_TOKEN', 'Refresh token đã hết hạn.')
  }

  // Delete old session (one-time use rotation)
  await db.delete(userSessions).where(eq(userSessions.id, session.id))

  // Generate new tokens
  // Need to fetch user role for access token
  const { users } = await import('@s-local/db/schema')
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1)

  if (!user) {
    throw new TokenError('USER_NOT_FOUND', 'Người dùng không tồn tại.')
  }

  const accessToken = await generateAccessToken({ id: user.id, role: user.role })
  const newRefreshToken = await generateRefreshToken(
    session.userId,
    session.deviceInfo as Record<string, unknown> | undefined,
    session.ipAddress || undefined,
  )

  return {
    access_token: accessToken,
    refresh_token: newRefreshToken,
    token_type: 'Bearer' as const,
    expires_in: APP_CONSTANTS.ACCESS_TOKEN_TTL_SECONDS,
  }
}

export async function revokeSession(sessionId: string) {
  const db = getDb()
  await db.delete(userSessions).where(eq(userSessions.id, sessionId))
}

export async function revokeAllSessions(userId: string) {
  const db = getDb()
  await db.delete(userSessions).where(eq(userSessions.userId, userId))
}

// ─── Token Error ───────────────────────────────────────
export class TokenError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'TokenError'
  }
}
