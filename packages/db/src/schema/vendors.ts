import { boolean, decimal, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'
import { users } from './users'

// ─── Enums ─────────────────────────────────────────────
export const vendorStatusEnum = pgEnum('vendor_status', ['pending', 'active', 'suspended'])
export const settlementTypeEnum = pgEnum('settlement_type', ['instant', 'periodic'])
export const serviceFulfillmentTypeEnum = pgEnum('service_fulfillment_type', [
  'fixed_price',
  'reservation',
])

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
  settlementType: settlementTypeEnum('settlement_type').notNull().default('periodic'),
  settlementPeriodDays: integer('settlement_period_days').notNull().default(3),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).notNull().default('8.00'),
  ratingAvg: decimal('rating_avg', { precision: 3, scale: 2 }).notNull().default('0.00'),
  reviewCount: integer('review_count').notNull().default(0),
  distanceKm: decimal('distance_km', { precision: 6, scale: 2 }),
  businessHours: jsonb('business_hours'),
  metadata: jsonb('metadata'),
  rejectionReason: text('rejection_reason'),
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
  fulfillmentType: serviceFulfillmentTypeEnum('fulfillment_type')
    .notNull()
    .default('fixed_price'),
  reservationDiscountPercent: decimal('reservation_discount_percent', { precision: 5, scale: 2 }),
  images: jsonb('images').$type<string[]>().default([]),
  options: jsonb('options'),
  durationMinutes: integer('duration_minutes'),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }).notNull().default('0.00'),
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

// ─── Combos ────────────────────────────────────────────
export const combos = pgTable('combos', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id),
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 200 }).notNull(),
  description: text('description'),
  coverImageUrl: text('cover_image_url'),
  originalPrice: decimal('original_price', { precision: 12, scale: 2 }).notNull(),
  comboPrice: decimal('combo_price', { precision: 12, scale: 2 }).notNull(),
  discountPct: decimal('discount_pct', { precision: 5, scale: 2 }),
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validTo: timestamp('valid_to', { withTimezone: true }),
  maxQuantity: integer('max_quantity'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('combos_vendor_id_idx').on(table.vendorId),
])

// ─── Combo Items ───────────────────────────────────────
export const comboItems = pgTable('combo_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  comboId: uuid('combo_id').notNull().references(() => combos.id, { onDelete: 'cascade' }),
  serviceId: uuid('service_id').notNull().references(() => services.id),
  quantity: integer('quantity').notNull().default(1),
}, (table) => [
  index('combo_items_combo_id_idx').on(table.comboId),
])

// ─── Vendor QR Secrets ─────────────────────────────────
export const vendorQrSecrets = pgTable('vendor_qr_secrets', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id),
  secret: text('secret').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('vendor_qr_secrets_vendor_id_idx').on(table.vendorId),
])
