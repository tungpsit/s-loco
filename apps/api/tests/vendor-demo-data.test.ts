import { describe, expect, test } from 'bun:test'
import { users, vendors } from '@S-Loco/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { getDb } from '../src/db'

describe('vendor demo data', () => {
  test('default vendor account owns a vendor profile', async () => {
    const db = getDb()
    const [row] = await db
      .select({ vendorId: vendors.id })
      .from(users)
      .innerJoin(vendors, eq(vendors.ownerId, users.id))
      .where(and(eq(users.email, 'vendor@sloco.vn'), isNull(vendors.deletedAt)))
      .limit(1)

    expect(row?.vendorId).toBeTruthy()
  })
})
