import { boolean, index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'
import { users } from './users'

// ─── Enums ─────────────────────────────────────────────
export const articleCategoryEnum = pgEnum('article_category', ['news', 'event', 'guide'])

// ─── Articles ──────────────────────────────────────────
export const articles = pgTable('articles', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).notNull().unique(),
  content: text('content'),
  coverImageUrl: text('cover_image_url'),
  category: articleCategoryEnum('category').notNull(),
  isPublished: boolean('is_published').notNull().default(false),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  authorId: uuid('author_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('articles_slug_idx').on(table.slug),
  index('articles_category_idx').on(table.category),
])
