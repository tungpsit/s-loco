import { serviceCategories, services, vendors } from '@S-Loco/db/schema'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../db'
import { calculateDistanceKm, hasGeoPoint, parseCoordinate } from '../lib/geo'

const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'
const DEFAULT_ITINERARY_AI_TIMEOUT_MS = 120_000

interface ItineraryInput {
  days: number
  budget: number
  preferences: string[]
  groupType: string
  stayLocationLabel?: string
  stayLatitude?: number
  stayLongitude?: number
  preferNearStay?: boolean
}

interface AvailableService {
  id: string
  name: string
  category: string | null
  categorySlug?: string | null
  description?: string | null
  price: string | null
  originalPrice: string
  vendorName: string
  vendorAddress?: string | null
  vendorLatitude?: string | number | null
  vendorLongitude?: string | number | null
  distanceFromStayKm?: number | null
  durationMinutes?: number | null
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string }
    text?: string
  }>
}

type ItinerarySlot = 'morning' | 'lunch' | 'afternoon' | 'evening'

interface ItineraryActivity {
  time: string
  title: string
  description?: string
  service_id: string | null
  estimated_cost?: number
  category?: string
  distance_from_stay_km?: number
}

interface ItineraryDay {
  day: number
  title?: string
  date?: string
  activities: ItineraryActivity[]
}

interface ItineraryResult {
  title: string
  summary: string
  days: ItineraryDay[]
  total_estimated_cost: number
  tips: string[]
}

const SLOT_TIMES: Record<ItinerarySlot, string> = {
  morning: '09:00',
  lunch: '12:00',
  afternoon: '15:00',
  evening: '19:00',
}

const SLOT_LABELS: Record<ItinerarySlot, string> = {
  morning: 'Buổi sáng',
  lunch: 'Bữa trưa',
  afternoon: 'Buổi chiều',
  evening: 'Buổi tối',
}

const SLOT_RULES: Record<ItinerarySlot, string> = {
  morning: 'biển, giải trí, xe điện, tour hoặc hoạt động ngoài trời',
  lunch: 'ẩm thực, nhà hàng, hải sản',
  afternoon: 'spa, massage, mua sắm, giải trí hoặc hoạt động trong nhà',
  evening: 'ẩm thực, giải trí, mua sắm hoặc dạo biển',
}

const SLOT_ORDER: ItinerarySlot[] = ['morning', 'lunch', 'afternoon', 'evening']

export async function generateItinerary(input: ItineraryInput) {
  const db = getDb()

  const availableServices = await db
    .select({
      id: services.id,
      name: services.name,
      category: serviceCategories.name,
      categorySlug: serviceCategories.slug,
      description: services.description,
      price: services.discountPrice,
      originalPrice: services.originalPrice,
      vendorName: vendors.name,
      vendorAddress: vendors.address,
      vendorLatitude: vendors.latitude,
      vendorLongitude: vendors.longitude,
      durationMinutes: services.durationMinutes,
    })
    .from(services)
    .innerJoin(vendors, eq(services.vendorId, vendors.id))
    .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .where(and(eq(services.isActive, true), eq(vendors.status, 'active')))
    .limit(50)

  const servicesWithDistance = attachDistanceFromStay(availableServices, input)
  const serviceList = buildServiceCatalog(servicesWithDistance)
  const slotRules = SLOT_ORDER.map((slot) => `- ${SLOT_LABELS[slot]}: ${SLOT_RULES[slot]}`).join(
    '\n',
  )
  const locationContext = buildLocationContext(input)

  const prompt = `Bạn là một hướng dẫn viên du lịch chuyên nghiệp tại Sầm Sơn, Thanh Hóa, Việt Nam.
Tạo lịch trình du lịch chi tiết cho khách du lịch với thông tin sau:
- Số ngày: ${input.days}
- Ngân sách: ${input.budget.toLocaleString('vi-VN')}đ
- Sở thích: ${input.preferences.join(', ')}
- Loại nhóm: ${input.groupType}
${locationContext}

Nhịp lịch trình mỗi ngày:
${slotRules}

Dựa trên các dịch vụ có sẵn trên nền tảng, chỉ dùng đúng ID trong danh sách này khi gắn service_id:
${serviceList}

Trả về JSON (không markdown) theo format:
{
  "title": "Tên lịch trình",
  "summary": "Mô tả ngắn",
  "days": [
    {
      "day": 1,
      "title": "Tên ngày",
      "activities": [
        {
          "time": "08:00",
          "title": "Tên hoạt động",
          "description": "Mô tả",
          "service_id": "uuid hoặc null nếu không map được",
          "estimated_cost": 100000
        }
      ]
    }
  ],
  "total_estimated_cost": 500000,
  "tips": ["Mẹo 1", "Mẹo 2"]
}`

  const apiKey = process.env.OPENAI_API_KEY || ''
  if (!apiKey) {
    return generateFallbackItinerary(input, availableServices)
  }

  try {
    const baseUrl = (process.env.OPENAI_BASE_URL || DEFAULT_OPENAI_BASE_URL).replace(/\/+$/, '')
    const model = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), getItineraryAiTimeoutMs())
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    }).finally(() => clearTimeout(timeout))

    if (!res.ok) {
      throw new Error(`OpenAI-compatible API returned ${res.status}`)
    }

    const data = (await res.json()) as ChatCompletionResponse
    const text = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return validateItinerary(JSON.parse(jsonMatch[0]), input, servicesWithDistance)
  } catch (err) {
    console.error('[Itinerary] AI API error:', err)
  }

  return generateFallbackItinerary(input, servicesWithDistance)
}

function getItineraryAiTimeoutMs() {
  const configured = Number(process.env.ITINERARY_AI_TIMEOUT_MS)
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_ITINERARY_AI_TIMEOUT_MS
}

function roundDistanceKm(km: number) {
  return Math.round(km * 10) / 10
}

function distanceKmForActivity(service: AvailableService | undefined, input: ItineraryInput): number | undefined {
  if (!service || !hasGeoPoint({ latitude: input.stayLatitude, longitude: input.stayLongitude })) return undefined
  const km = service.distanceFromStayKm
  if (km === undefined || km === null) return undefined
  return roundDistanceKm(km)
}

function attachDistanceFromStay(availableServices: AvailableService[], input: ItineraryInput) {
  if (!hasGeoPoint({ latitude: input.stayLatitude, longitude: input.stayLongitude })) {
    return availableServices.map(({ distanceFromStayKm: _distanceFromStayKm, ...service }) => service)
  }

  const stayLatitude = input.stayLatitude
  const stayLongitude = input.stayLongitude
  if (stayLatitude === undefined || stayLongitude === undefined) return availableServices

  const stayPoint = { latitude: stayLatitude, longitude: stayLongitude }
  return availableServices.map((service) => {
    if (service.distanceFromStayKm !== undefined && service.distanceFromStayKm !== null) {
      return service
    }
    const latitude = parseCoordinate(service.vendorLatitude)
    const longitude = parseCoordinate(service.vendorLongitude)
    if (latitude === undefined || longitude === undefined) return service

    return {
      ...service,
      distanceFromStayKm: calculateDistanceKm(stayPoint, { latitude, longitude }),
    }
  })
}

function buildLocationContext(input: ItineraryInput) {
  if (
    !input.stayLocationLabel &&
    input.stayLatitude === undefined &&
    input.stayLongitude === undefined
  ) {
    return '- Vị trí lưu trú: chưa cung cấp\n- Ưu tiên gần nơi lưu trú: Không'
  }

  const coordinates =
    input.stayLatitude !== undefined && input.stayLongitude !== undefined
      ? ` (${input.stayLatitude}, ${input.stayLongitude})`
      : ''
  const label = input.stayLocationLabel || 'tọa độ khách cung cấp'
  const preference = input.preferNearStay
    ? 'Có - ưu tiên dịch vụ gần nơi lưu trú khi vẫn phù hợp sở thích, ngân sách và nhịp ngày'
    : 'Không - chỉ dùng vị trí làm thông tin tham khảo, không ép chọn dịch vụ gần'
  return `- Vị trí lưu trú: ${label}${coordinates}\n- Ưu tiên gần nơi lưu trú: ${preference}`
}

function buildServiceCatalog(availableServices: AvailableService[]) {
  if (availableServices.length === 0) {
    return '- Chưa có dịch vụ active phù hợp trên nền tảng.'
  }

  const byCategory = new Map<string, AvailableService[]>()
  for (const service of availableServices) {
    const category = service.category || 'Khác'
    byCategory.set(category, [...(byCategory.get(category) || []), service])
  }

  return [...byCategory.entries()]
    .map(([category, items]) => {
      const rows = items.map((service) => {
        const price = getServicePrice(service)
        const address = service.vendorAddress ? `, ${service.vendorAddress}` : ''
        const distance =
          service.distanceFromStayKm !== undefined && service.distanceFromStayKm !== null
            ? `, cách nơi lưu trú ${service.distanceFromStayKm}km`
            : ''
        return `  - ${service.name} — ${price}đ tại ${service.vendorName}${address}${distance} [ID: ${service.id}]`
      })
      return `${category}:\n${rows.join('\n')}`
    })
    .join('\n')
}

function validateItinerary(
  raw: Partial<ItineraryResult>,
  input: ItineraryInput,
  availableServices: AvailableService[],
): ItineraryResult {
  const serviceById = new Map(availableServices.map((service) => [service.id, service]))
  const usedServiceIds = new Set<string>()
  const days = normalizeDays(raw.days, input.days)

  const validatedDays = days.map((day, index) => {
    const activities = normalizeActivities(day.activities).map((activity) => {
      const slot = inferSlot(activity.time)
      let service = activity.service_id ? serviceById.get(activity.service_id) : undefined
      const needsReplacement = Boolean(activity.service_id && !service)

      if (needsReplacement) {
        service = selectService(availableServices, slot, input.preferences, usedServiceIds, {
          preferNearStay: input.preferNearStay,
        })
      }

      if (service) {
        usedServiceIds.add(service.id)
      }

      return mergeActivityWithService(activity, service, needsReplacement, input)
    })

    return {
      ...day,
      day: Number(day.day || index + 1),
      title: day.title || `Ngày ${index + 1}`,
      activities: diversifyDay(
        activities,
        availableServices,
        input.preferences,
        usedServiceIds,
        input.preferNearStay,
        input,
      ),
    }
  })

  const total = validatedDays.reduce(
    (sum, day) =>
      sum + day.activities.reduce((daySum, activity) => daySum + (activity.estimated_cost || 0), 0),
    0,
  )

  return {
    title: raw.title || `Lịch trình ${input.days} ngày tại Sầm Sơn`,
    summary: raw.summary || `Hành trình ${input.groupType} ${input.days} ngày khám phá Sầm Sơn`,
    days: validatedDays,
    total_estimated_cost: total,
    tips: Array.isArray(raw.tips) ? raw.tips.map(String) : defaultTips(),
  }
}

function generateFallbackItinerary(input: ItineraryInput, availableServices: AvailableService[]) {
  const usedServiceIds = new Set<string>()
  const days: ItineraryDay[] = []

  for (let d = 1; d <= input.days; d++) {
    const activities =
      availableServices.length > 0
        ? SLOT_ORDER.flatMap((slot) => {
            const service = selectService(
              availableServices,
              slot,
              input.preferences,
              usedServiceIds,
              { allowRepeatWhenExhausted: true, preferNearStay: input.preferNearStay },
            )
            if (!service) return []
            usedServiceIds.add(service.id)
            return [activityFromService(service, slot, undefined, input)]
          })
        : genericActivities()

    days.push({ day: d, title: `Ngày ${d}`, activities })
  }

  return validateItinerary(
    {
      title: `Lịch trình ${input.days} ngày tại Sầm Sơn`,
      summary: `Hành trình ${input.groupType} ${input.days} ngày khám phá Sầm Sơn`,
      days,
      tips: defaultTips(),
    },
    input,
    availableServices,
  )
}

function normalizeDays(days: ItineraryDay[] | undefined, requestedDays: number) {
  if (Array.isArray(days) && days.length > 0) return days

  return Array.from({ length: requestedDays }, (_, index) => ({
    day: index + 1,
    title: `Ngày ${index + 1}`,
    activities: [],
  }))
}

function normalizeActivities(activities: ItineraryActivity[] | undefined) {
  if (!Array.isArray(activities)) return []

  return activities.map((activity) => ({
    time: String(activity.time || '09:00'),
    title: String(activity.title || 'Hoạt động'),
    description: activity.description ? String(activity.description) : '',
    service_id: activity.service_id ? String(activity.service_id) : null,
    estimated_cost: toNumber(activity.estimated_cost),
    category: activity.category ? String(activity.category) : undefined,
  }))
}

function diversifyDay(
  activities: ItineraryActivity[],
  availableServices: AvailableService[],
  preferences: string[],
  usedServiceIds: Set<string>,
  preferNearStay = false,
  input: ItineraryInput,
) {
  if (activities.length === 0) return activities

  const serviceById = new Map(availableServices.map((service) => [service.id, service]))
  const linkedServices = activities
    .map((activity) => (activity.service_id ? serviceById.get(activity.service_id) : undefined))
    .filter((service): service is AvailableService => Boolean(service))

  const hasOnlyFood = linkedServices.length > 0 && linkedServices.every(isFoodService)
  const hasNonFoodPool = availableServices.some((service) => !isFoodService(service))
  if (!hasOnlyFood || !hasNonFoodPool) return activities

  const replacementIndex = activities.findIndex((activity) => inferSlot(activity.time) !== 'lunch')
  if (replacementIndex === -1) return activities

  const slot = inferSlot(activities[replacementIndex]!.time)
  const replacement = selectService(availableServices, slot, preferences, usedServiceIds, {
    requireNonFood: true,
    preferNearStay,
  })
  if (!replacement) return activities

  usedServiceIds.add(replacement.id)
  const nextActivities = [...activities]
  nextActivities[replacementIndex] = activityFromService(
    replacement,
    slot,
    activities[replacementIndex]!.time,
    input,
  )
  return nextActivities
}

function mergeActivityWithService(
  activity: ItineraryActivity,
  service: AvailableService | undefined,
  replacedService: boolean,
  input: ItineraryInput,
) {
  if (!service) {
    return {
      time: activity.time,
      title: activity.title,
      description: activity.description,
      service_id: null,
      estimated_cost: activity.estimated_cost || 0,
      category: activity.category,
    }
  }

  if (replacedService) {
    return activityFromService(service, inferSlot(activity.time), activity.time, input)
  }

  const km = distanceKmForActivity(service, input)
  const { distance_from_stay_km: _dropAiDistance, ...activityRest } = activity
  return {
    ...activityRest,
    service_id: service.id,
    estimated_cost: getServicePrice(service),
    category: service.category || activity.category,
    ...(km === undefined ? {} : { distance_from_stay_km: km }),
  }
}

function selectService(
  servicesPool: AvailableService[],
  slot: ItinerarySlot,
  preferences: string[],
  usedServiceIds: Set<string>,
  opts: {
    allowRepeatWhenExhausted?: boolean
    requireNonFood?: boolean
    preferNearStay?: boolean
  } = {},
) {
  const candidates = rankServices(
    servicesPool,
    slot,
    preferences,
    usedServiceIds,
    opts.requireNonFood,
    opts.preferNearStay,
  )
  const service = candidates.find(
    (candidate) => candidate.score > Number.NEGATIVE_INFINITY,
  )?.service
  if (service || !opts.allowRepeatWhenExhausted) return service

  return rankServices(
    servicesPool,
    slot,
    preferences,
    new Set(),
    opts.requireNonFood,
    opts.preferNearStay,
  ).find((candidate) => candidate.score > Number.NEGATIVE_INFINITY)?.service
}

function rankServices(
  servicesPool: AvailableService[],
  slot: ItinerarySlot,
  preferences: string[],
  usedServiceIds: Set<string>,
  requireNonFood = false,
  preferNearStay = false,
) {
  return servicesPool
    .filter((service) => !requireNonFood || !isFoodService(service))
    .map((service, index) => ({
      service,
      score: scoreService(service, slot, preferences, usedServiceIds, index, preferNearStay),
    }))
    .sort((a, b) => b.score - a.score)
}

function scoreService(
  service: AvailableService,
  slot: ItinerarySlot,
  preferences: string[],
  usedServiceIds: Set<string>,
  index: number,
  preferNearStay = false,
) {
  if (usedServiceIds.has(service.id)) return Number.NEGATIVE_INFINITY

  let score = matchesSlot(service, slot) ? 100 : 15
  if (preferences.some((preference) => serviceText(service).includes(normalizeText(preference)))) {
    score += 25
  }
  if (slot !== 'lunch' && !isFoodService(service)) {
    score += 10
  }
  if (preferNearStay) {
    score += proximityScore(service)
  }
  score -= Math.min(getServicePrice(service) / 100000, 10)
  score -= index / 100
  return score
}

function matchesSlot(service: AvailableService, slot: ItinerarySlot) {
  const text = serviceText(service)
  if (slot === 'lunch') return isFoodService(service)
  if (slot === 'morning') return hasAny(text, ['giai tri', 'xe dien', 'tour', 'bien'])
  if (slot === 'afternoon') return hasAny(text, ['spa', 'massage', 'mua sam', 'giai tri'])
  return hasAny(text, ['am thuc', 'nha hang', 'hai san', 'giai tri', 'mua sam', 'bien'])
}

function inferSlot(time: string): ItinerarySlot {
  const hour = Number.parseInt(time.split(':')[0] || '9', 10)
  if (Number.isNaN(hour)) return 'morning'
  if (hour < 11) return 'morning'
  if (hour < 14) return 'lunch'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

function activityFromService(
  service: AvailableService,
  slot: ItinerarySlot,
  time: string | undefined,
  input: ItineraryInput,
) {
  const slotTime = time ?? SLOT_TIMES[slot]
  const km = distanceKmForActivity(service, input)
  return {
    time: slotTime,
    title: service.name,
    description: `Trải nghiệm ${service.name} tại ${service.vendorName}`,
    service_id: service.id,
    estimated_cost: getServicePrice(service),
    category: service.category || undefined,
    ...(km === undefined ? {} : { distance_from_stay_km: km }),
  }
}

function genericActivities() {
  return SLOT_ORDER.map((slot) => ({
    time: SLOT_TIMES[slot],
    title: SLOT_LABELS[slot],
    description: `${SLOT_LABELS[slot]} tự do tại Sầm Sơn`,
    service_id: null,
    estimated_cost: 0,
  }))
}

function defaultTips() {
  return [
    'Mang kem chống nắng',
    'Thử hải sản tươi tại chợ Sầm Sơn',
    'Đặt dịch vụ trước để có giá tốt',
  ]
}

function getServicePrice(service: AvailableService) {
  return toNumber(service.price || service.originalPrice)
}

function proximityScore(service: AvailableService) {
  if (service.distanceFromStayKm === undefined || service.distanceFromStayKm === null) return -20
  return Math.max(0, 30 - service.distanceFromStayKm * 6)
}

function toNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function isFoodService(service: AvailableService) {
  return hasAny(serviceText(service), ['am thuc', 'food', 'nha hang', 'hai san', 'bun', 'lau'])
}

function serviceText(service: AvailableService) {
  return normalizeText(
    [service.name, service.category, service.categorySlug, service.description, service.vendorName]
      .filter(Boolean)
      .join(' '),
  )
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
}

function hasAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle))
}
