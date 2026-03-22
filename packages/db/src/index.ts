import { drizzle } from 'drizzle-orm/bun-sql'

import * as relations from './relations'
import * as schema from './schema'

// Create the database client
export function createDb(url?: string) {
  const databaseUrl = url || process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required')
  }
  return drizzle(databaseUrl, { schema: { ...schema, ...relations } })
}

// Singleton for application use
let _db: ReturnType<typeof createDb> | null = null

export function getDb() {
  if (!_db) {
    _db = createDb()
  }
  return _db
}

export type DB = ReturnType<typeof createDb>

// Re-export everything
export * from './relations'
export * from './schema'

