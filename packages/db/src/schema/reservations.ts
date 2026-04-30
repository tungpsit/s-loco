import {
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { users } from './users'
import { services, vendors } from './vendors'

export const reservationStatusEnum = pgEnum('reservation_status', [
  'requested',
  'confirmed',
  'voucher_issued',
  'used',
  'settled',
  'rejected',
  'cancelled',
])

export const reservationDiscountVoucherStatusEnum = pgEnum('reservation_discount_voucher_status', [
  'issuing',
  'active',
  'used',
  'settled',
  'issue_failed',
  'cancelled',
])

export const reservations = pgTable(
  'reservations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => vendors.id),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id),
    customerName: varchar('customer_name', { length: 200 }),
    customerPhone: varchar('customer_phone', { length: 20 }),
    partySize: integer('party_size').notNull(),
    requestedTime: timestamp('requested_time', { withTimezone: true }).notNull(),
    customerNote: text('customer_note'),
    status: reservationStatusEnum('status').notNull().default('requested'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    rejectedAt: timestamp('rejected_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    usedAt: timestamp('used_at', { withTimezone: true }),
    settledAt: timestamp('settled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('reservations_user_id_idx').on(table.userId),
    index('reservations_vendor_id_idx').on(table.vendorId),
    index('reservations_service_id_idx').on(table.serviceId),
    index('reservations_status_idx').on(table.status),
  ],
)

export const reservationDiscountVouchers = pgTable(
  'reservation_discount_vouchers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reservationId: uuid('reservation_id')
      .notNull()
      .references(() => reservations.id, { onDelete: 'cascade' }),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => vendors.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).notNull(),
    iposVoucherCode: varchar('ipos_voucher_code', { length: 100 }),
    iposVoucherId: varchar('ipos_voucher_id', { length: 255 }),
    status: reservationDiscountVoucherStatusEnum('status').notNull().default('issuing'),
    issueAttemptCount: integer('issue_attempt_count').notNull().default(0),
    issueError: text('issue_error'),
    rawIssueResponse: jsonb('raw_issue_response'),
    usedAt: timestamp('used_at', { withTimezone: true }),
    billAmount: decimal('bill_amount', { precision: 12, scale: 2 }),
    discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }),
    commissionAmount: decimal('commission_amount', { precision: 12, scale: 2 }),
    iposTransactionId: varchar('ipos_transaction_id', { length: 255 }),
    rawUsedWebhook: jsonb('raw_used_webhook'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('reservation_discount_vouchers_reservation_id_idx').on(table.reservationId),
    uniqueIndex('reservation_discount_vouchers_ipos_code_idx').on(table.iposVoucherCode),
    index('reservation_discount_vouchers_vendor_id_idx').on(table.vendorId),
    index('reservation_discount_vouchers_status_idx').on(table.status),
  ],
)

export const iposWebhookEvents = pgTable(
  'ipos_webhook_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull(),
    reservationVoucherId: uuid('reservation_voucher_id').references(
      () => reservationDiscountVouchers.id,
    ),
    iposVoucherCode: varchar('ipos_voucher_code', { length: 100 }),
    iposTransactionId: varchar('ipos_transaction_id', { length: 255 }),
    payload: jsonb('payload').notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    processingError: text('processing_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('ipos_webhook_events_idempotency_key_idx').on(table.idempotencyKey),
    index('ipos_webhook_events_voucher_id_idx').on(table.reservationVoucherId),
  ],
)
