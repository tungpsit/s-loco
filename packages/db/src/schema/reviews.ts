import { boolean, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { vouchers } from './orders'
import { users } from './users'
import { services, vendors } from './vendors'

// ─── Reviews ───────────────────────────────────────────
export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id),
  serviceId: uuid('service_id').references(() => services.id),
  voucherId: uuid('voucher_id').references(() => vouchers.id),
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment'),
  isVisible: boolean('is_visible').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('reviews_vendor_id_idx').on(table.vendorId),
  index('reviews_user_id_idx').on(table.userId),
])
