import Redis from 'ioredis'

let redisClient: Redis | null = null

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
    redisClient.on('error', (err) => console.error('[Redis]', err))
  }
  return redisClient
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    return (async (...args: unknown[]) => {
      const client = getRedis()
      const method = prop as keyof Redis
      const result = await (client[method] as (...args: unknown[]) => unknown).call(client, ...args)
      return result
    }) as never
  },
})
