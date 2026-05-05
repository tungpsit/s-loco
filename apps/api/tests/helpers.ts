/**
 * Test helpers — send HTTP requests to running local API.
 */

let requestCounter = 0

/** Make a request to the test API */
export async function request(
  path: string,
  opts?: RequestInit & { json?: unknown; token?: string },
) {
  const url = new URL(path, process.env.TEST_API_BASE_URL || 'http://localhost:3000')
  requestCounter += 1
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-forwarded-for': `127.0.0.${(requestCounter % 250) + 1}`,
  }
  if (opts?.token) headers.Authorization = `Bearer ${opts.token}`
  if (opts?.headers) Object.assign(headers, opts.headers as Record<string, string>)

  const res = await fetch(url.toString(), {
    method: opts?.method || 'GET',
    headers,
    body: opts?.json ? JSON.stringify(opts.json) : (opts?.body as BodyInit | null | undefined),
  })

  let data: unknown = null
  const text = await res.text()
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  return { status: res.status, data }
}

/** Admin login helper — returns JWT token */
export async function adminLogin() {
  const { data } = await request('/api/v1/auth/login', {
    method: 'POST',
    json: { email: 'admin@sloco.vn', password: 'admin123' },
  })
  return data?.data?.tokens?.access_token || data?.data?.access_token || null
}

/** Vendor login helper */
export async function vendorLogin() {
  const { data } = await request('/api/v1/auth/login', {
    method: 'POST',
    json: { email: 'vendor@sloco.vn', password: 'vendor123' },
  })
  return data?.data?.tokens?.access_token || data?.data?.access_token || null
}

/** Generate a random phone number for OTP tests */
export function randomPhone() {
  return `09${Math.floor(10000000 + Math.random() * 90000000)}`
}
