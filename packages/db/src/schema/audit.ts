import { index, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { users } from './users'

// ─── Audit Logs ────────────────────────────────────────
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  performedBy: uuid('performed_by').references(() => users.id),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('audit_logs_entity_idx').on(table.entityType, table.entityId),
  index('audit_logs_performed_by_idx').on(table.performedBy),
])
