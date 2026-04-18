import { boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'
import { users } from './users'

// ---- Saved Itineraries ---------------------------------
export const savedItineraries = pgTable('saved_itineraries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  days: integer('days').notNull(),
  budget: integer('budget').notNull(),
  preferences: jsonb('preferences'),
  groupType: varchar('group_type', { length: 50 }),
  resultJson: jsonb('result_json').notNull(),
  isShared: boolean('is_shared').notNull().default(false),
  shareToken: text('share_token').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('saved_itineraries_user_id_idx').on(table.userId),
  uniqueIndex('saved_itineraries_share_token_idx').on(table.shareToken),
])