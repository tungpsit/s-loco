import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

// ─── Enums ─────────────────────────────────────────────
export const userRoleEnum = pgEnum('user_role', ['tourist', 'vendor_owner', 'admin'])

// ─── Users ─────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: varchar('phone', { length: 20 }).unique(),
  email: varchar('email', { length: 255 }).unique(),
  fullName: varchar('full_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').notNull().default('tourist'),
  passwordHash: text('password_hash'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('users_phone_idx').on(table.phone),
  uniqueIndex('users_email_idx').on(table.email),
])

// ─── User Sessions ─────────────────────────────────────
export const userSessions = pgTable('user_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  deviceInfo: jsonb('device_info'),
  ipAddress: varchar('ip_address', { length: 45 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('user_sessions_user_id_idx').on(table.userId),
])

// ─── OTP Codes ─────────────────────────────────────────
export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: varchar('phone', { length: 20 }).notNull(),
  code: varchar('code', { length: 4 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  verified: boolean('verified').notNull().default(false),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('otp_codes_phone_expires_idx').on(table.phone, table.expiresAt),
])
