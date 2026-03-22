/**
 * Test helpers — creates a Hono app instance for testing
 * without actually starting the HTTP server.
 */
import app from '../src/index';

// Re-export the app's fetch for Bun test
export const testFetch = app.fetch

/** Make a request to the test app */
export async function request(path: string, opts?: RequestInit & { json?: any; token?: string }) {
  const url = new URL(path, 'http://localhost:3000')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts?.token) headers['Authorization'] = `Bearer ${opts.token}`
  if (opts?.headers) Object.assign(headers, opts.headers)

  const res = await testFetch(
    new Request(url.toString(), {
      method: opts?.method || 'GET',
      headers,
      body: opts?.json ? JSON.stringify(opts.json) : opts?.body,
    }),
  )
  const data = await res.json()
  return { status: res.status, data }
}

/** Admin login helper — returns JWT token */
export async function adminLogin() {
  const { data } = await request('/api/v1/auth/login', {
    method: 'POST',
    json: { email: 'admin@s-loco.vn', password: 'admin123' },
  })
  return data?.data?.access_token || null
}

/** Vendor login helper */
export async function vendorLogin() {
  const { data } = await request('/api/v1/auth/login', {
    method: 'POST',
    json: { email: 'vendor@test.vn', password: 'vendor123' },
  })
  return data?.data?.access_token || null
}

/** Generate a random phone number for OTP tests */
export function randomPhone() {
  return `09${Math.floor(10000000 + Math.random() * 90000000)}`
}
