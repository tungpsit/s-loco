// Load .env before any imports
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

import { describe, expect, test } from 'bun:test'

describe('Health Check', () => {
  test('GET /health returns 200 with ok status', async () => {
    const res = await fetch('http://localhost:3000/health')
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('ok')
  })

  test('GET /health — response shape is stable', async () => {
    const res = await fetch('http://localhost:3000/health')
    const data = await res.json()
    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('version')
    expect(data).toHaveProperty('timestamp')
    expect(typeof data.timestamp).toBe('string')
    expect(new Date(data.timestamp).toString()).not.toBe('Invalid Date')
  })

  test('GET /docs returns HTML', async () => {
    const res = await fetch('http://localhost:3000/docs')
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('<!DOCTYPE html>')
  })
})
