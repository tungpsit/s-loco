import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres-js'

async function runMigrations() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is required')

  const client = postgres(url)
  const db = drizzle(client)

  console.log('[Migration] Running migrations...')
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('[Migration] Done.')

  await client.end()
}

runMigrations().catch((err) => {
  console.error('[Migration] Failed:', err)
  process.exit(1)
})
