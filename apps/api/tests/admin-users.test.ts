import { users } from '@S-Loco/db/schema'
import { describe, expect, test } from 'bun:test'
import { getDb } from '../src/db'
import { adminLogin, randomPhone, request } from './helpers'

describe('Admin user profile management', () => {
  test('PATCH /admin/users/:id updates user avatar from uploaded image URL', async () => {
    const token = await adminLogin()
    expect(token).toBeTruthy()

    const userId = await createTouristUser('avatar-update')
    const avatarUrl = 'http://localhost:3000/user_avatar/admin/avatar.webp'

    const updated = await request(`/api/v1/admin/users/${userId}`, {
      method: 'PATCH',
      token,
      json: {
        full_name: 'Avatar Updated User',
        avatar_url: avatarUrl,
      },
    })

    expect(updated.status).toBe(200)
    expect(updated.data.success).toBe(true)
    expect(updated.data.data.user).toMatchObject({
      id: userId,
      fullName: 'Avatar Updated User',
      avatarUrl,
    })

    const fetched = await request(`/api/v1/admin/users/${userId}`, { token })
    expect(fetched.status).toBe(200)
    expect(fetched.data.data.user.avatarUrl).toBe(avatarUrl)
  })
})

async function createTouristUser(label: string) {
  const db = getDb()
  const [user] = await db
    .insert(users)
    .values({
      email: `tourist-${label}-${crypto.randomUUID()}@example.com`,
      phone: randomPhone(),
      fullName: `Tourist ${label}`,
      role: 'tourist',
    })
    .returning()
  if (!user) throw new Error('Unable to create tourist user')
  return user.id
}
