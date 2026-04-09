import { getDb } from '../db'
import { articles } from '@S-Loco/db/schema'
import { and, eq, sql } from 'drizzle-orm'

/** Non-null assertion for Drizzle scalar selects */
function scalar<T>(rows: T[]): T {
  return rows[0]!
}

export async function listArticles(opts: { category?: string; page?: number; limit?: number }) {
  const db = getDb()
  const page = opts.page || 1
  const limit = opts.limit || 20
  const offset = (page - 1) * limit
  const conditions = [eq(articles.isPublished, true)]
  if (opts.category) conditions.push(eq(articles.category, opts.category as any))
  const items = await db
    .select()
    .from(articles)
    .where(and(...conditions))
    .orderBy(sql`${articles.publishedAt} DESC NULLS LAST`)
    .limit(limit)
    .offset(offset)
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(and(...conditions))
  return { items, total: Number(scalar(rows).count), page, limit }
}

export async function getArticleBySlug(slug: string) {
  const db = getDb()
  const [article] = await db
    .select()
    .from(articles)
    .where(and(eq(articles.slug, slug), eq(articles.isPublished, true)))
    .limit(1)
  if (!article) throw new ContentError('NOT_FOUND', 'Bài viết không tồn tại.')
  return article
}

export async function createArticle(
  authorId: string,
  data: {
    title: string
    slug: string
    content?: string
    coverImageUrl?: string
    category: 'news' | 'event' | 'guide'
    isPublished?: boolean
  },
) {
  const db = getDb()
  const [article] = await db
    .insert(articles)
    .values({
      ...data,
      authorId,
      publishedAt: data.isPublished ? new Date() : null,
    })
    .returning()
  return article!
}

export async function updateArticle(
  articleId: string,
  data: Partial<{
    title: string
    slug: string
    content: string
    coverImageUrl: string
    category: 'news' | 'event' | 'guide'
    isPublished: boolean
  }>,
) {
  const db = getDb()
  const updates: Record<string, any> = { ...data, updatedAt: new Date() }
  if (data.isPublished === true) updates.publishedAt = new Date()
  const [updated] = await db
    .update(articles)
    .set(updates)
    .where(eq(articles.id, articleId))
    .returning()
  if (!updated) throw new ContentError('NOT_FOUND', 'Bài viết không tồn tại.')
  return updated
}

export async function deleteArticle(articleId: string) {
  const db = getDb()
  await db.delete(articles).where(eq(articles.id, articleId))
  return { success: true }
}

let weatherCache: { data: any; cachedAt: number } | null = null
const WEATHER_CACHE_TTL = 30 * 60 * 1000

export async function getWeather() {
  if (weatherCache && Date.now() - weatherCache.cachedAt < WEATHER_CACHE_TTL)
    return weatherCache.data
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=19.75&longitude=105.90&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=Asia/Ho_Chi_Minh&forecast_days=7',
    )
    const data = await res.json()
    weatherCache = { data, cachedAt: Date.now() }
    return data
  } catch {
    return { error: 'Không thể lấy dữ liệu thời tiết.' }
  }
}

export async function listUpcomingEvents(limit = 10) {
  const db = getDb()
  return db
    .select()
    .from(articles)
    .where(and(eq(articles.category, 'event'), eq(articles.isPublished, true)))
    .orderBy(sql`${articles.publishedAt} DESC`)
    .limit(limit)
}

export class ContentError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'ContentError'
  }
}
