import { articles } from '@S-Loco/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { getDb } from '../db'

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

type OpenMeteoForecast = {
  latitude?: number
  longitude?: number
  timezone?: string
  current?: Record<string, number | string | undefined>
  daily?: Record<string, Array<number | string | undefined> | undefined>
}

type OpenMeteoMarine = {
  current?: Record<string, number | string | undefined>
  daily?: Record<string, Array<number | string | undefined> | undefined>
}

let weatherCache: { data: { weather: WeatherPayload }; cachedAt: number } | null = null
const WEATHER_CACHE_TTL = 30 * 60 * 1000
const SAM_SON_COORDS = { latitude: 19.75, longitude: 105.9 }
const SAM_SON_LOCATION = 'Bãi biển Sầm Sơn, Thanh Hóa'

export async function getWeather() {
  if (weatherCache && Date.now() - weatherCache.cachedAt < WEATHER_CACHE_TTL)
    return weatherCache.data

  try {
    const [forecastRes, marineRes] = await Promise.all([
      fetch(buildForecastUrl()),
      fetch(buildMarineUrl()),
    ])

    if (!forecastRes.ok) throw new Error('Forecast API failed')
    const forecast = (await forecastRes.json()) as OpenMeteoForecast
    const marine = marineRes.ok ? ((await marineRes.json()) as OpenMeteoMarine) : undefined
    const data = { weather: normalizeWeather(forecast, marine) }
    weatherCache = { data, cachedAt: Date.now() }
    return data
  } catch {
    if (weatherCache) return weatherCache.data
    return { weather: fallbackWeather() }
  }
}

export function clearWeatherCacheForTests() {
  weatherCache = null
}

function buildForecastUrl() {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.search = new URLSearchParams({
    latitude: String(SAM_SON_COORDS.latitude),
    longitude: String(SAM_SON_COORDS.longitude),
    timezone: 'Asia/Ho_Chi_Minh',
    forecast_days: '7',
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'rain',
      'weather_code',
      'cloud_cover',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'uv_index_max',
      'sunrise',
      'sunset',
    ].join(','),
  }).toString()
  return url
}

function buildMarineUrl() {
  const url = new URL('https://marine-api.open-meteo.com/v1/marine')
  url.search = new URLSearchParams({
    latitude: String(SAM_SON_COORDS.latitude),
    longitude: String(SAM_SON_COORDS.longitude),
    timezone: 'Asia/Ho_Chi_Minh',
    forecast_days: '7',
    current: [
      'wave_height',
      'wave_period',
      'sea_surface_temperature',
      'ocean_current_velocity',
    ].join(','),
    daily: ['wave_height_max', 'wave_period_max'].join(','),
  }).toString()
  return url
}

type WeatherPayload = ReturnType<typeof normalizeWeather>

function normalizeWeather(forecast: OpenMeteoForecast, marine?: OpenMeteoMarine) {
  const current = forecast.current ?? {}
  const daily = forecast.daily ?? {}
  const marineCurrent = marine?.current ?? {}
  const marineDaily = marine?.daily ?? {}
  const todayRainProbability = numberAt(daily.precipitation_probability_max, 0)
  const todayUvIndex = numberAt(daily.uv_index_max, 0)
  const conditionCode = numberValue(current.weather_code)
  const waveHeight = numberValue(marineCurrent.wave_height)
  const beach = {
    wave_height: round(waveHeight, 1),
    wave_period: round(numberValue(marineCurrent.wave_period), 1),
    sea_surface_temperature: round(numberValue(marineCurrent.sea_surface_temperature), 1),
    current_velocity: round(numberValue(marineCurrent.ocean_current_velocity), 1),
    safety_label: beachSafetyLabel(waveHeight, numberValue(current.wind_speed_10m)),
    safety_tip: beachSafetyTip(
      waveHeight,
      numberValue(current.wind_speed_10m),
      todayRainProbability,
    ),
  }

  const payload = {
    location: {
      name: SAM_SON_LOCATION,
      latitude: forecast.latitude ?? SAM_SON_COORDS.latitude,
      longitude: forecast.longitude ?? SAM_SON_COORDS.longitude,
      timezone: forecast.timezone ?? 'Asia/Ho_Chi_Minh',
      source: 'Open-Meteo',
    },
    updated_at: stringValue(current.time) || new Date().toISOString(),
    temperature: Math.round(numberValue(current.temperature_2m)),
    apparent_temperature: Math.round(numberValue(current.apparent_temperature)),
    condition: weatherCodeLabel(conditionCode),
    condition_code: conditionCode,
    is_day: numberValue(current.is_day) === 1,
    humidity: Math.round(numberValue(current.relative_humidity_2m)),
    wind_speed: Math.round(numberValue(current.wind_speed_10m)),
    wind_direction: Math.round(numberValue(current.wind_direction_10m)),
    wind_gusts: Math.round(numberValue(current.wind_gusts_10m)),
    uv_index: round(todayUvIndex, 1),
    rain_probability: Math.round(todayRainProbability),
    precipitation: round(numberValue(current.precipitation), 1),
    rain: round(numberValue(current.rain), 1),
    cloud_cover: Math.round(numberValue(current.cloud_cover)),
    beach,
    travel_tip: travelTip(todayUvIndex, todayRainProbability, waveHeight),
    forecast: arrayValue(daily.time).map((date, index) => ({
      date: String(date),
      day: formatDay(String(date)),
      high: Math.round(numberAt(daily.temperature_2m_max, index)),
      low: Math.round(numberAt(daily.temperature_2m_min, index)),
      condition: weatherCodeLabel(numberAt(daily.weather_code, index)),
      condition_code: numberAt(daily.weather_code, index),
      rain_probability: Math.round(numberAt(daily.precipitation_probability_max, index)),
      precipitation: round(numberAt(daily.precipitation_sum, index), 1),
      uv_index: round(numberAt(daily.uv_index_max, index), 1),
      wind_speed: Math.round(numberAt(daily.wind_speed_10m_max, index)),
      wind_gusts: Math.round(numberAt(daily.wind_gusts_10m_max, index)),
      sunrise: stringAt(daily.sunrise, index),
      sunset: stringAt(daily.sunset, index),
      wave_height: round(numberAt(marineDaily.wave_height_max, index), 1),
      wave_period: round(numberAt(marineDaily.wave_period_max, index), 1),
    })),
  }

  return payload
}

function fallbackWeather(): { [key: string]: unknown } {
  return {
    location: {
      name: SAM_SON_LOCATION,
      latitude: SAM_SON_COORDS.latitude,
      longitude: SAM_SON_COORDS.longitude,
      timezone: 'Asia/Ho_Chi_Minh',
      source: 'Open-Meteo',
    },
    updated_at: new Date().toISOString(),
    temperature: 0,
    apparent_temperature: 0,
    condition: 'Chưa có dữ liệu',
    condition_code: -1,
    is_day: true,
    humidity: 0,
    wind_speed: 0,
    wind_direction: 0,
    wind_gusts: 0,
    uv_index: 0,
    rain_probability: 0,
    precipitation: 0,
    rain: 0,
    cloud_cover: 0,
    beach: {
      wave_height: 0,
      wave_period: 0,
      sea_surface_temperature: 0,
      current_velocity: 0,
      safety_label: 'Chưa có dữ liệu',
      safety_tip:
        'Không thể tải dữ liệu thời tiết. Vui lòng kiểm tra dự báo địa phương trước khi ra biển.',
    },
    travel_tip: 'Không thể tải dữ liệu thời tiết. Vui lòng thử lại sau.',
    forecast: [],
  }
}

function weatherCodeLabel(code: number) {
  if ([0].includes(code)) return 'Trời quang'
  if ([1, 2].includes(code)) return 'Ít mây'
  if ([3].includes(code)) return 'Nhiều mây'
  if ([45, 48].includes(code)) return 'Sương mù'
  if ([51, 53, 55, 56, 57, 61, 80].includes(code)) return 'Mưa nhẹ'
  if ([63, 65, 66, 67, 81, 82].includes(code)) return 'Mưa vừa đến to'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Mưa tuyết'
  if ([95, 96, 99].includes(code)) return 'Dông'
  return 'Đang cập nhật'
}

function travelTip(uvIndex: number, rainProbability: number, waveHeight: number) {
  if (waveHeight >= 1.5)
    return 'Sóng cao, nên ưu tiên hoạt động trong nhà hoặc hỏi cứu hộ trước khi tắm biển.'
  if (rainProbability >= 70)
    return 'Có khả năng mưa cao, nên mang áo mưa mỏng và chọn lịch trình linh hoạt.'
  if (uvIndex >= 8)
    return 'Chỉ số UV cao, nên dùng kem chống nắng, đội mũ và tránh nắng gắt giữa trưa.'
  return 'Thời tiết phù hợp để dạo biển, ăn uống và đặt dịch vụ ngoài trời.'
}

function beachSafetyLabel(waveHeight: number, windSpeed: number) {
  if (waveHeight >= 1.5 || windSpeed >= 35) return 'Cần thận trọng'
  if (waveHeight >= 0.8 || windSpeed >= 22) return 'Theo dõi thêm'
  return 'Thuận lợi'
}

function beachSafetyTip(waveHeight: number, windSpeed: number, rainProbability: number) {
  if (waveHeight >= 1.5 || windSpeed >= 35)
    return 'Biển động hoặc gió mạnh, không nên bơi xa bờ và cần theo hướng dẫn cứu hộ.'
  if (rainProbability >= 70)
    return 'Dễ có mưa, nên chuẩn bị phương án di chuyển và ăn uống gần nơi lưu trú.'
  return 'Điều kiện biển tương đối ổn, vẫn nên quan sát cờ cảnh báo trước khi xuống nước.'
}

function formatDay(date: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(`${date}T00:00:00+07:00`))
}

function arrayValue(value: unknown): Array<number | string | undefined> {
  return Array.isArray(value) ? value : []
}

function numberAt(value: unknown, index: number) {
  return numberValue(arrayValue(value)[index])
}

function stringAt(value: unknown, index: number) {
  return stringValue(arrayValue(value)[index])
}

function numberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function round(value: number, precision: number) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
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
