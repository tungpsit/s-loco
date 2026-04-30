import { serviceCategories, services, vendors } from '@S-Loco/db/schema'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../db'

const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'

interface ItineraryInput {
  days: number
  budget: number
  preferences: string[]
  groupType: string
}

interface AvailableService {
  id: string
  name: string
  category: string | null
  price: string | null
  originalPrice: string
  vendorName: string
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string }
    text?: string
  }>
}

export async function generateItinerary(input: ItineraryInput) {
  const db = getDb()

  const availableServices = await db
    .select({
      id: services.id,
      name: services.name,
      category: serviceCategories.name,
      price: services.discountPrice,
      originalPrice: services.originalPrice,
      vendorName: vendors.name,
    })
    .from(services)
    .innerJoin(vendors, eq(services.vendorId, vendors.id))
    .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .where(and(eq(services.isActive, true), eq(vendors.status, 'active')))
    .limit(50)

  const serviceList = availableServices
    .map(
      (s) =>
        `- ${s.name} (${s.category || 'Khác'}) — ${s.price || s.originalPrice}đ tại ${s.vendorName} [ID: ${s.id}]`,
    )
    .join('\n')

  const prompt = `Bạn là một hướng dẫn viên du lịch chuyên nghiệp tại Sầm Sơn, Thanh Hóa, Việt Nam.
Tạo lịch trình du lịch chi tiết cho khách du lịch với thông tin sau:
- Số ngày: ${input.days}
- Ngân sách: ${input.budget.toLocaleString('vi-VN')}đ
- Sở thích: ${input.preferences.join(', ')}
- Loại nhóm: ${input.groupType}

Dựa trên các dịch vụ có sẵn trên nền tảng:
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
    return generateMockItinerary(input, availableServices)
  }

  try {
    const baseUrl = (process.env.OPENAI_BASE_URL || DEFAULT_OPENAI_BASE_URL).replace(/\/+$/, '')
    const model = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    })

    if (!res.ok) {
      throw new Error(`OpenAI-compatible API returned ${res.status}`)
    }

    const data = (await res.json()) as ChatCompletionResponse
    const text = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
  } catch (err) {
    console.error('[Itinerary] AI API error:', err)
  }

  return generateMockItinerary(input, availableServices)
}

function generateMockItinerary(input: ItineraryInput, availableServices: AvailableService[]) {
  const days = []
  for (let d = 1; d <= input.days; d++) {
    const activities = availableServices.slice((d - 1) * 3, d * 3).map((s, i) => ({
      time: `${8 + i * 3}:00`,
      title: s.name,
      description: `Trải nghiệm ${s.name} tại ${s.vendorName}`,
      service_id: s.id,
      estimated_cost: Number(s.price || s.originalPrice),
    }))
    days.push({ day: d, title: `Ngày ${d}`, activities })
  }
  return {
    title: `Lịch trình ${input.days} ngày tại Sầm Sơn`,
    summary: `Hành trình ${input.groupType} ${input.days} ngày khám phá Sầm Sơn`,
    days,
    total_estimated_cost: input.budget,
    tips: [
      'Mang kem chống nắng',
      'Thử hải sản tươi tại chợ Sầm Sơn',
      'Đặt dịch vụ trước để có giá tốt',
    ],
  }
}
