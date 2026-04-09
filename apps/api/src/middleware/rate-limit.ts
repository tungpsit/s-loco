import type { Context, Next } from 'hono'
import Redis from 'ioredis'

let redisClient: Redis | null = null

function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
    redisClient.on('error', (err) => console.error('[Redis]', err))
  }
  return redisClient
}

interface RateLimitOptions {
  windowMs: number
  max: number
  keyGenerator: (c: Context) => string
  message?: string
}

export function rateLimiter(options: RateLimitOptions) {
  return async (c: Context, next: Next) => {
    const key = `rate:${options.keyGenerator(c)}`
    const limit = options.max
    const windowSec = Math.ceil(options.windowMs / 1000)

    try {
      const redis = getRedis()
      const now = Date.now()
      const windowStart = now - options.windowMs

      // Sliding window: remove old entries, add current, count
      await redis.zremrangebyscore(key, 0, windowStart)
      const count = await redis.zcard(key)

      // Set rate limit headers
      const remaining = Math.max(0, limit - count - 1)
      c.header('X-RateLimit-Limit', String(limit))
      c.header('X-RateLimit-Remaining', String(remaining))
      c.header('X-RateLimit-Reset', String(Math.ceil((now + options.windowMs) / 1000)))

      if (count >= limit) {
        const retryAfter = windowSec
        c.header('Retry-After', String(retryAfter))
        return c.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMITED',
              message: options.message || 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
            },
          },
          429,
        )
      }

      await redis.zadd(key, now, `${now}:${Math.random()}`)
      await redis.expire(key, windowSec)
    } catch {
      // If Redis is down, allow the request through (fail-open)
      console.warn('[RateLimit] Redis unavailable, allowing request')
    }

    await next()
  }
}

// ─── Pre-configured instances ──────────────────────────

/** OTP: 5 requests per minute per phone */
export const otpRateLimit = (phoneExtractor: (c: Context) => string) =>
  rateLimiter({
    windowMs: 60_000,
    max: 5,
    keyGenerator: (c) => `otp:${phoneExtractor(c)}`,
    message: 'Quá nhiều yêu cầu OTP. Vui lòng thử lại sau 1 phút.',
  })

/** API: 100 requests per minute per IP */
export const apiRateLimit = rateLimiter({
  windowMs: 60_000,
  max: 100,
  keyGenerator: (c) =>
    `api:${c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'}`,
})

/** Auth: 20 requests per minute per IP */
export const authRateLimit = rateLimiter({
  windowMs: 60_000,
  max: 20,
  keyGenerator: (c) =>
    `auth:${c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'}`,
  message: 'Quá nhiều lần đăng nhập. Vui lòng thử lại sau.',
})
