import { getDb } from '../db'
import { auditLogs, users } from '@S-Loco/db/schema'
import { and, eq, sql } from 'drizzle-orm'

/** Non-null assertion for Drizzle limit(1) / scalar select returning arrays */
function scalar<T>(rows: T[]): T {
  return rows[0]!
}

export async function listUsers(opts: { role?: string; page?: number; limit?: number }) {
  const db = getDb()
  const page = opts.page || 1
  const limit = opts.limit || 20
  const offset = (page - 1) * limit

  const conditions: ReturnType<typeof eq>[] = []
  if (opts.role) conditions.push(eq(users.role, opts.role as any))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const items = await db
    .select({
      id: users.id,
      phone: users.phone,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(where)
    .orderBy(sql`${users.createdAt} DESC`)
    .limit(limit)
    .offset(offset)

  const rows = await db.select({ count: sql<number>`count(*)` }).from(users).where(where)

  return { items, total: Number(scalar(rows).count), page, limit }
}

export async function updateUserRole(userId: string, role: string, adminId: string) {
  const db = getDb()

  // Prevent self-demotion
  if (userId === adminId) {
    throw new AdminError('FORBIDDEN', 'Không thể thay đổi vai trò của chính mình.')
  }

  // Fetch target user
  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!target) throw new AdminError('NOT_FOUND', 'Người dùng không tồn tại.')

  // Prevent removing the last admin
  if (target.role === 'admin' && role !== 'admin') {
    const adminCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, 'admin'))
    if (scalar(adminCount).count <= 1) {
      throw new AdminError('FORBIDDEN', 'Không thể hạ cấp tài khoản admin cuối cùng.')
    }
  }

  // Update role
  const [updated] = await db
    .update(users)
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

  // Audit log
  await db.insert(auditLogs).values({
    entityType: 'user',
    entityId: userId,
    action: 'role_change',
    oldData: { role: target.role },
    newData: { role },
    performedBy: adminId,
  })

  return updated
}

export async function updateUserStatus(userId: string, isActive: boolean, adminId: string) {
  const db = getDb()

  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!target) throw new AdminError('NOT_FOUND', 'Người dùng không tồn tại.')

  // Prevent deactivating last admin
  if (target.role === 'admin' && !isActive) {
    const adminCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, 'admin'))
    if (scalar(adminCount).count <= 1) {
      throw new AdminError('FORBIDDEN', 'Không thể vô hiệu hóa tài khoản admin cuối cùng.')
    }
  }

  const [updated] = await db
    .update(users)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      phone: users.phone,
      fullName: users.fullName,
      role: users.role,
      isActive: users.isActive,
    })
  if (!updated) throw new AdminError('NOT_FOUND', 'Người dùng không tồn tại.')

  // Audit log
  await db.insert(auditLogs).values({
    entityType: 'user',
    entityId: userId,
    action: 'status_change',
    oldData: { isActive: target.isActive },
    newData: { isActive },
    performedBy: adminId,
  })

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

export async function getUserById(userId: string) {
  const db = getDb()
  const [user] = await db
    .select({
      id: users.id,
      phone: users.phone,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!user) throw new AdminError('NOT_FOUND', 'Người dùng không tồn tại.')
  return user
}
