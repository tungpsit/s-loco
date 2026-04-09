import * as schema from '@S-Loco/db/schema'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres-js'

let _client: ReturnType<typeof postgres> | null = null
let _db: ReturnType<typeof drizzle> | null = null

function getClient() {
  if (!_client) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is required')
    _client = postgres(url)
  }
  return _client
}

// Singleton db instance using postgres-js driver
export function getDb() {
  if (!_db) {
    _db = drizzle(getClient(), { schema })
  }
  return _db
}

export { getClient as getPostgresClient, schema }
