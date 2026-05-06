import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const smsLogStatusEnum = pgEnum('sms_log_status', [
  'pending',
  'accepted',
  'failed',
  'delivered',
  'undelivered',
  'unknown',
])

export const smsLogs = pgTable('sms_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  provider: varchar('provider', { length: 50 }).notNull(),
  purpose: varchar('purpose', { length: 50 }).notNull().default('otp'),
  phone: varchar('phone', { length: 32 }).notNull(),
  content: text('content').notNull(),
  requestId: varchar('request_id', { length: 50 }),
  smsId: varchar('sms_id', { length: 100 }),
  status: smsLogStatusEnum('status').notNull().default('pending'),
  codeResult: varchar('code_result', { length: 20 }),
  errorMessage: text('error_message'),
  sendStatus: varchar('send_status', { length: 50 }),
  requestPayload: jsonb('request_payload'),
  responsePayload: jsonb('response_payload'),
  callbackPayload: jsonb('callback_payload'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  callbackReceivedAt: timestamp('callback_received_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('sms_logs_provider_idx').on(table.provider),
  index('sms_logs_phone_idx').on(table.phone),
  index('sms_logs_request_id_idx').on(table.requestId),
  index('sms_logs_sms_id_idx').on(table.smsId),
  index('sms_logs_status_idx').on(table.status),
  index('sms_logs_created_at_idx').on(table.createdAt),
])
