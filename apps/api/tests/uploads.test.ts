import { describe, expect, test } from 'bun:test'
import { adminLogin, vendorLogin } from './helpers'

const API_BASE = process.env.TEST_API_BASE_URL || 'http://localhost:3000'

async function uploadImage({
  token,
  file,
  purpose,
  path = '/api/v1/admin/uploads',
}: {
  token: string
  file: File
  purpose: string
  path?: string
}) {
  const body = new FormData()
  body.set('file', file)
  body.set('purpose', purpose)

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  })

  const data = await res.json()
  return { status: res.status, data }
}

async function requireAdminToken() {
  const token = await adminLogin()
  expect(token).toBeTruthy()
  return token as string
}

async function requireVendorToken() {
  const token = await vendorLogin()
  expect(token).toBeTruthy()
  return token as string
}

describe('Admin uploads', () => {
  test('POST /admin/uploads accepts content_cover purpose', async () => {
    const token = await requireAdminToken()

    const file = new File(['fake image bytes'], 'cover.png', { type: 'image/png' })
    const { status, data } = await uploadImage({ token, file, purpose: 'content_cover' })

    expect(status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.key).toContain('content_cover/')
    expect(data.data.url).toContain('content_cover/')
    expect(data.data.contentType).toBe('image/png')
    expect(data.data.size).toBe(file.size)
  })

  test('POST /admin/uploads accepts user_avatar purpose', async () => {
    const token = await requireAdminToken()

    const file = new File(['fake image bytes'], 'avatar.webp', { type: 'image/webp' })
    const { status, data } = await uploadImage({ token, file, purpose: 'user_avatar' })

    expect(status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.key).toContain('user_avatar/')
    expect(data.data.contentType).toBe('image/webp')
  })

  test('POST /admin/uploads rejects unknown purpose', async () => {
    const token = await requireAdminToken()

    const file = new File(['fake image bytes'], 'generic.png', { type: 'image/png' })
    const { status, data } = await uploadImage({ token, file, purpose: 'generic' })

    expect(status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INVALID_PURPOSE')
  })

  test('POST /admin/uploads rejects unsupported image type', async () => {
    const token = await requireAdminToken()

    const file = new File(['not an image'], 'notes.txt', { type: 'text/plain' })
    const { status, data } = await uploadImage({ token, file, purpose: 'content_cover' })

    expect(status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INVALID_FILE_TYPE')
  })

  test('POST /admin/uploads rejects oversized images', async () => {
    const token = await requireAdminToken()

    const bytes = new Uint8Array(5 * 1024 * 1024 + 1)
    const file = new File([bytes], 'large.png', { type: 'image/png' })
    const { status, data } = await uploadImage({ token, file, purpose: 'content_cover' })

    expect(status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FILE_TOO_LARGE')
  })
})

describe('Authenticated uploads', () => {
  test('POST /uploads/images accepts vendor service image uploads', async () => {
    const token = await requireVendorToken()

    const file = new File(['fake image bytes'], 'service.png', { type: 'image/png' })
    const { status, data } = await uploadImage({
      token,
      file,
      purpose: 'service_image',
      path: '/api/v1/uploads/images',
    })

    expect(status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.key).toContain('service_image/')
    expect(data.data.url).toContain('service_image/')
    expect(data.data.contentType).toBe('image/png')
    expect(data.data.size).toBe(file.size)
  })
})
