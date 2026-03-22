import { getDb } from '@s-local/db';
import { users } from '@s-local/db/schema';
import { and, eq, sql } from 'drizzle-orm';

export async function listUsers(opts: { role?: string; page?: number; limit?: number }) {
  const db = getDb()
  const page = opts.page || 1
  const limit = opts.limit || 20
  const offset = (page - 1) * limit

  const conditions: ReturnType<typeof eq>[] = []
  if (opts.role) conditions.push(eq(users.role, opts.role as any))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const items = await db.select({
    id: users.id,
    phone: users.phone,
    email: users.email,
    fullName: users.fullName,
    role: users.role,
    isActive: users.isActive,
    createdAt: users.createdAt,
  }).from(users)
    .where(where)
    .orderBy(sql`${users.createdAt} DESC`)
    .limit(limit)
    .offset(offset)

  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(users)
    .where(where)

  return { items, total: Number(count), page, limit }
}

export async function updateUserRole(userId: string, role: string) {
  const db = getDb()
  const [updated] = await db.update(users)
    .set({ role: role as any, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      phone: users.phone,
      fullName: users.fullName,
      role: users.role,
    })
  if (!updated) throw new AdminError('NOT_FOUND', 'Người dùng không tồn tại.')
  return updated
}

export class AdminError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'AdminError'
  }
}
