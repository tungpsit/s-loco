import { getDb } from '@s-local/db'
import { categories, services, vendors } from '@s-local/db/schema'
import { and, eq } from 'drizzle-orm'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

interface ItineraryInput {
  days: number
  budget: number
  preferences: string[]
  groupType: string
}

export async function generateItinerary(input: ItineraryInput) {
  const db = getDb()

  const availableServices = await db.select({
    id: services.id,
    name: services.name,
    category: categories.name,
    price: services.discountPrice,
    originalPrice: services.originalPrice,
    vendorName: vendors.name,
  })
    .from(services)
    .innerJoin(vendors, eq(services.vendorId, vendors.id))
    .leftJoin(categories, eq(services.categoryId, categories.id))
    .where(and(eq(services.isActive, true), eq(vendors.status, 'active')))
    .limit(50)

  const serviceList = availableServices.map((s) =>
    `- ${s.name} (${s.category || 'Khác'}) — ${s.price || s.originalPrice}đ tại ${s.vendorName} [ID: ${s.id}]`
  ).join('\n')

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

  if (!GEMINI_API_KEY) {
    return generateMockItinerary(input, availableServices)
  }

  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    })

    const data = await res.json() as any
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
  } catch (err) {
    console.error('[Itinerary] Gemini API error:', err)
  }

  return generateMockItinerary(input, availableServices)
}

function generateMockItinerary(input: ItineraryInput, availableServices: any[]) {
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
    tips: ['Mang kem chống nắng', 'Thử hải sản tươi tại chợ Sầm Sơn', 'Đặt dịch vụ trước để có giá tốt'],
  }
}
