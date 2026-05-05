/**
 * seeds/03-demo-reviews.ts
 * Seed demo reviews for the Phase 2 vendor and service discovery.
 * Run: bun run packages/db/seeds/03-demo-reviews.ts
 * (Run 01-categories.ts and 02-demo-data.ts first)
 */

import { eq } from 'drizzle-orm'
import { createDb } from '../src/index'
import { users } from '../src/schema/users'
import { vendors } from '../src/schema/vendors'
import { reviews } from '../src/schema/reviews'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const DEMO_REVIEWS = [
  {
    rating: 5,
    comment:
      'Hải sản cực kỳ tươi ngon! Tôm hùm nướng phô mai thơm lừng, thịt dai ngọt. Nhân viên phục vụ nhiệt tình, view biển đẹp. Sẽ quay lại!',
    tags: ['hải sản tươi', 'view đẹp', 'phục vụ tốt'],
  },
  {
    rating: 5,
    comment:
      'Lần đầu đến Sầm Sơn và được bạn bè giới thiệu quán này. Đúng là đặc sản biển! Bún cá cay vừa miệng, nước dùng đậm đà. Giá cả hợp lý cho du lịch.',
    tags: ['bún cá', 'đặc sản', 'hợp túi tiền'],
  },
  {
    rating: 4,
    comment:
      'Quán rộng rãi, sạch sẽ, nhân viên vui vẻ. Lẩu hải sản 4 người ăn no nê. Chỉ mất thời gian đợi món khoảng 20 phút lúc cao điểm.',
    tags: ['lẩu hải sản', 'đông khách', 'chờ lâu'],
  },
  {
    rating: 5,
    comment:
      'Mua voucher trên app S-Loco tiện lợi lắm! Đến quán quét QR là dùng được ngay, không phải xếp hàng thanh toán. Tiết kiệm được 55k cho set 2 người.',
    tags: ['voucher tiện', 'qr nhanh', 'tiết kiệm'],
  },
  {
    rating: 4,
    comment:
      'Vị trí thuận tiện, gần bãi biển. Đồ ăn ngon, nhất là tôm hùm. Không gian quán mát mẻ. Buổi tối có nhạc sống khá hay.',
    tags: ['vị trí đẹp', 'nhạc sống', 'mát mẻ'],
  },
  {
    rating: 3,
    comment:
      'Đồ ăn ngon nhưng cuối tuần đông quá, phục vụ hơi chậm. Nên đặt trước qua app để không phải chờ.',
    tags: ['đông', 'chờ lâu', 'nên đặt trước'],
  },
  {
    rating: 5,
    comment:
      'Quán check-in cực đẹp! Trần nhà gỗ, view bãi biển, món ăn hấp dẫn. Đi du lịch Sầm Sơn mà không ghé quán này thì phí lắm.',
    tags: ['check-in đẹp', 'du lịch', 'nên thử'],
  },
  {
    rating: 5,
    comment:
      'Combo 4 người rất xứng đáng! Đầy đủ các loại hải sản: tôm, cua, ghẹ, ốc. Ăn một bữa no cả ngày. Gia đình tôi rất hài lòng.',
    tags: ['combo ngon', 'gia đình', 'no bụng'],
  },
]

async function seed() {
  console.log('🌱 Seeding demo reviews...')
  const db = createDb()

  // Get demo vendor
  const [vendor] = await db
    .select()
    .from(vendors)
    .where(eq(vendors.slug, slugify('Nhà Hàng Hải Sản Biển Đông')))

  if (!vendor) {
    console.error('❌ Demo vendor not found — run 02-demo-data.ts first')
    process.exit(1)
  }

  // Get tourist user for reviewer
  const [tourist] = await db.select().from(users).where(eq(users.email, 'tourist@sloco.vn'))
  const reviewerId = tourist?.id ?? vendor.ownerId // fallback to vendor owner

  // Insert reviews
  console.log(`📝 Inserting ${DEMO_REVIEWS.length} reviews for vendor: ${vendor.name}`)
  await db.insert(reviews).values(
    DEMO_REVIEWS.map((r) => ({
      userId: reviewerId,
      vendorId: vendor.id,
      rating: r.rating,
      comment: r.comment,
      tags: r.tags,
      isVisible: true,
    })),
  ).onConflictDoNothing()

  const inserted = await db
    .select()
    .from(reviews)
    .where(eq(reviews.vendorId, vendor.id))

  console.log(`✅ ${inserted.length} reviews seeded`)
  for (const r of inserted) {
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)
    console.log(`   ${stars} ${r.comment?.slice(0, 60)}...`)
  }

  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
