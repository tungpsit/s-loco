import { defineConfig } from 'drizzle-kit'
import { readFileSync, existsSync } from 'node:fs'

const envPath = '../../.env'
if (existsSync(envPath)) {
  const envText = readFileSync(envPath, 'utf8')
  for (const line of envText.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, '')
    if (!(key in process.env)) process.env[key] = value
  }
}

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error('DATABASE_URL is required. Ensure ../../.env exists and contains DATABASE_URL')
}

console.log('[Migration] DATABASE_URL:', url)

export default defineConfig({
  out: './drizzle/migrations',
  schema: './src/schema',
  dialect: 'postgresql',
  dbCredentials: {
    url,
  },
})
