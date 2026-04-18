import { randomUUID } from 'crypto'
import { getDb } from '../db'
import { savedItineraries } from '@S-Loco/db/schema'
import { and, desc, eq, isNull } from 'drizzle-orm'

// ---- Save AI Itinerary ---------------------------------
export async function saveItinerary(
  userId: string,
  itineraryData: {
    title: string
    days: number
    budget: number
    preferences: string[]
    groupType: string
    resultJson: Record<string, unknown>
  },
  isShared = false,
) {
  const db = getDb()

  const shareToken = isShared ? generateShareToken() : null

  const [row] = await db
    .insert(savedItineraries)
    .values({
      userId,
      title: itineraryData.title,
      days: itineraryData.days,
      budget: itineraryData.budget,
      preferences: itineraryData.preferences as any,
      groupType: itineraryData.groupType,
      resultJson: itineraryData.resultJson as any,
      isShared,
      shareToken,
    })
    .returning()

  return row
}

// ---- List user's saved itineraries --------------------
export async function listSavedItineraries(userId: string) {
  const db = getDb()

  const rows = await db
    .select({
      id: savedItineraries.id,
      title: savedItineraries.title,
      days: savedItineraries.days,
      budget: savedItineraries.budget,
      groupType: savedItineraries.groupType,
      isShared: savedItineraries.isShared,
      shareToken: savedItineraries.shareToken,
      createdAt: savedItineraries.createdAt,
    })
    .from(savedItineraries)
    .where(eq(savedItineraries.userId, userId))
    .orderBy(desc(savedItineraries.createdAt))

  return rows
}

// ---- Get itinerary by share token (public, no auth) ----
export async function getItineraryByShareToken(token: string) {
  const db = getDb()

  const [row] = await db
    .select()
    .from(savedItineraries)
    .where(and(eq(savedItineraries.shareToken, token), eq(savedItineraries.isShared, true)))
    .limit(1)

  if (!row) throw new ItinerarySaveError('NOT_FOUND', 'Lịch trình không tồn tại hoặc không được chia sẻ.')

  return row
}

// ---- Generate share token ------------------------------
export function generateShareToken() {
  return randomUUID()
}

// ---- Itinerary Save Error ------------------------------
export class ItinerarySaveError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'ItinerarySaveError'
  }
}
