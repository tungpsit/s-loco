import { boolean, decimal, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'
import { users } from './users'

// ─── Enums ─────────────────────────────────────────────
export const vendorStatusEnum = pgEnum('vendor_status', ['pending', 'active', 'suspended', 'rejected'])

// ─── Vendors ───────────────────────────────────────────
export const vendors = pgTable('vendors', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  description: text('description'),
  logoUrl: text('logo_url'),
  coverImageUrl: text('cover_image_url'),
  address: text('address'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  status: vendorStatusEnum('status').notNull().default('pending'),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).notNull().default('8.00'),
  ratingAvg: decimal('rating_avg', { precision: 3, scale: 2 }).notNull().default('0.00'),
  reviewCount: integer('review_count').notNull().default(0),
  businessHours: jsonb('business_hours'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('vendors_slug_idx').on(table.slug),
  index('vendors_owner_id_idx').on(table.ownerId),
  index('vendors_status_idx').on(table.status),
])

// ─── Service Categories ────────────────────────────────
export const serviceCategories = pgTable('service_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  icon: varchar('icon', { length: 50 }),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
})

// ─── Services ──────────────────────────────────────────
export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id),
  categoryId: uuid('category_id').notNull().references(() => serviceCategories.id),
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 200 }).notNull(),
  description: text('description'),
  originalPrice: decimal('original_price', { precision: 12, scale: 2 }).notNull(),
  discountPrice: decimal('discount_price', { precision: 12, scale: 2 }),
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }),
  images: jsonb('images').$type<string[]>().default([]),
  options: jsonb('options'),
  durationMinutes: integer('duration_minutes'),
  maxQuantityPerOrder: integer('max_quantity_per_order').notNull().default(10),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('services_vendor_id_idx').on(table.vendorId),
  index('services_category_id_idx').on(table.categoryId),
])
