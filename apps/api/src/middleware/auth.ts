import type { Context, Next } from 'hono'
import { verifyAccessToken } from '../services/token.service'

type Variables = {
  userId: string | null
  userRole: string | null
}

// ─── Auth Middleware (required) ─────────────────────────
export function authMiddleware() {
  return async (c: Context<{ Variables: Variables }>, next: Next) => {
    const authHeader = c.req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Token xác thực không tồn tại.' },
        },
        401,
      )
    }

    const token = authHeader.substring(7)

    try {
      const payload = await verifyAccessToken(token)
      c.set('userId', payload.userId)
      c.set('userRole', payload.role)
    } catch {
      return c.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Token không hợp lệ hoặc đã hết hạn.' },
        },
        401,
      )
    }

    await next()
  }
}

// ─── Role Middleware ────────────────────────────────────
export function requireRole(...roles: string[]) {
  return async (c: Context<{ Variables: Variables }>, next: Next) => {
    const userRole = c.get('userRole')

    if (!userRole || !roles.includes(userRole)) {
      return c.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Bạn không có quyền truy cập.' } },
        403,
      )
    }

    await next()
  }
}

// ─── Optional Auth Middleware ───────────────────────────
export function optionalAuth() {
  return async (c: Context<{ Variables: Variables }>, next: Next) => {
    c.set('userId', null)
    c.set('userRole', null)

    const authHeader = c.req.header('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const payload = await verifyAccessToken(token)
        c.set('userId', payload.userId)
        c.set('userRole', payload.role)
      } catch {
        // Silently ignore invalid tokens for optional auth
      }
    }

    await next()
  }
}
