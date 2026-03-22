import { decimal, index, integer, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { vouchers } from './orders'
import { users } from './users'
import { vendors } from './vendors'

// ─── Enums ─────────────────────────────────────────────
export const settlementStatusEnum = pgEnum('settlement_status', ['pending', 'approved', 'disbursed', 'rejected'])

// ─── Settlements ───────────────────────────────────────
export const settlements = pgTable('settlements', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  commissionAmount: decimal('commission_amount', { precision: 12, scale: 2 }).notNull(),
  netAmount: decimal('net_amount', { precision: 12, scale: 2 }).notNull(),
  voucherCount: integer('voucher_count').notNull().default(0),
  status: settlementStatusEnum('status').notNull().default('pending'),
  approvedBy: uuid('approved_by').references(() => users.id),
  disbursedAt: timestamp('disbursed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('settlements_vendor_id_idx').on(table.vendorId),
  index('settlements_status_idx').on(table.status),
])

// ─── Settlement Items ──────────────────────────────────
export const settlementItems = pgTable('settlement_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  settlementId: uuid('settlement_id').notNull().references(() => settlements.id, { onDelete: 'cascade' }),
  voucherId: uuid('voucher_id').notNull().references(() => vouchers.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  commission: decimal('commission', { precision: 12, scale: 2 }).notNull(),
}, (table) => [
  index('settlement_items_settlement_id_idx').on(table.settlementId),
])
