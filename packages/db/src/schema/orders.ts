import { decimal, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'
import { users } from './users'
import { combos, services, vendors } from './vendors'

// ─── Enums ─────────────────────────────────────────────
export const orderStatusEnum = pgEnum('order_status', ['created', 'paid', 'partially_refunded', 'refunded', 'cancelled'])
export const voucherStatusEnum = pgEnum('voucher_status', ['created', 'paid', 'redeemed', 'completed', 'settled', 'refunded', 'expired', 'cancelled'])
export const voucherArtifactTypeEnum = pgEnum('voucher_artifact_type', ['voucher', 'ticket'])
export const paymentGatewayEnum = pgEnum('payment_gateway', ['vnpay', 'momo', 'sepay'])
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'success', 'failed', 'refunded'])

// ─── Orders ────────────────────────────────────────────
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  finalAmount: decimal('final_amount', { precision: 12, scale: 2 }).notNull(),
  status: orderStatusEnum('status').notNull().default('created'),
  note: text('note'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('orders_user_id_idx').on(table.userId),
  index('orders_status_idx').on(table.status),
])

// ─── Order Items ───────────────────────────────────────
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  serviceId: uuid('service_id').notNull().references(() => services.id),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id),
  comboId: uuid('combo_id').references(() => combos.id),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 12, scale: 2 }).notNull(),
  options: jsonb('options'),
  serviceSnapshot: jsonb('service_snapshot').notNull(), // Frozen service data at purchase time
}, (table) => [
  index('order_items_order_id_idx').on(table.orderId),
])

// ─── Vouchers ──────────────────────────────────────────
export const vouchers = pgTable('vouchers', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderItemId: uuid('order_item_id').notNull().references(() => orderItems.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id),
  serviceId: uuid('service_id').notNull().references(() => services.id),
  code: varchar('code', { length: 20 }).notNull().unique(),
  artifactType: voucherArtifactTypeEnum('artifact_type').notNull().default('voucher'),
  qrToken: text('qr_token'),
  giftToken: text('gift_token').unique(),
  status: voucherStatusEnum('status').notNull().default('created'),
  redeemedAt: timestamp('redeemed_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  settledAt: timestamp('settled_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  version: integer('version').notNull().default(1), // Optimistic locking
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('vouchers_code_idx').on(table.code),
  uniqueIndex('vouchers_gift_token_idx').on(table.giftToken),
  index('vouchers_user_id_idx').on(table.userId),
  index('vouchers_vendor_id_idx').on(table.vendorId),
  index('vouchers_status_idx').on(table.status),
])

// ─── Payments ──────────────────────────────────────────
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  gateway: paymentGatewayEnum('gateway').notNull(),
  gatewayTransactionId: varchar('gateway_transaction_id', { length: 255 }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull().unique(),
  paymentUrl: text('payment_url'),
  rawWebhook: jsonb('raw_webhook'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('payments_order_id_idx').on(table.orderId),
  uniqueIndex('payments_idempotency_key_idx').on(table.idempotencyKey),
])

// ─── Refunds ───────────────────────────────────────────
export const refunds = pgTable('refunds', {
  id: uuid('id').defaultRandom().primaryKey(),
  voucherId: uuid('voucher_id').notNull().references(() => vouchers.id),
  paymentId: uuid('payment_id').notNull().references(() => payments.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  gateway: paymentGatewayEnum('gateway').notNull(),
  gatewayRefundId: varchar('gateway_refund_id', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  reason: text('reason'),
  initiatedBy: uuid('initiated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('refunds_voucher_id_idx').on(table.voucherId),
  index('refunds_payment_id_idx').on(table.paymentId),
])

// ─── Voucher Audit Log ─────────────────────────────────
export const voucherAuditLog = pgTable('voucher_audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  voucherId: uuid('voucher_id').notNull().references(() => vouchers.id),
  fromStatus: varchar('from_status', { length: 50 }),
  toStatus: varchar('to_status', { length: 50 }).notNull(),
  actorId: uuid('actor_id').references(() => users.id),
  actorType: varchar('actor_type', { length: 50 }),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('voucher_audit_log_voucher_id_idx').on(table.voucherId),
  index('voucher_audit_log_created_at_idx').on(table.createdAt),
])

// ─── Payment Events ─────────────────────────────────────
export const paymentEvents = pgTable('payment_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  gateway: paymentGatewayEnum('gateway').notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull().unique(),
  orderId: uuid('order_id').references(() => orders.id),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  payload: jsonb('payload'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('payment_events_gateway_idx').on(table.gateway),
  index('payment_events_order_id_idx').on(table.orderId),
])
