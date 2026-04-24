// Test setup - load environment variables
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const envPath = resolve(__dirname, '../../.env')
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

export {}
