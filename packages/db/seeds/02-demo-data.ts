/**
 * seeds/02-demo-data.ts
 * Seed demo data for S-Loco: admin, vendor owner, tourist user,
 * 1 demo vendor, services, sample orders/vouchers.
 * Run: bun run packages/db/seeds/02-demo-data.ts
 * (Run 01-categories.ts first to ensure categories exist)
 */

import { and, eq } from 'drizzle-orm'
import { createDb } from '../src/index'
import { orders } from '../src/schema/orders'
import { users } from '../src/schema/users'
import { serviceCategories, services, vendors } from '../src/schema/vendors'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function seed() {
  console.log('🌱 Seeding demo data...')
  const db = createDb()

  // ─── 1. Admin ─────────────────────────────────────────
  console.log('👤 [1/5] Creating admin user...')
  const adminHash = await Bun.password.hash('admin123', { algorithm: 'bcrypt', cost: 12 })
  await db
    .insert(users)
    .values({
      phone: '0900000001',
      email: 'admin@sloco.vn',
      fullName: 'S-Loco Admin',
      role: 'admin',
      passwordHash: adminHash,
    })
    .onConflictDoNothing()
  const [admin] = await db.select().from(users).where(eq(users.email, 'admin@sloco.vn'))
  console.log(`   ✅ Admin: ${admin?.email}`)

  // ─── 2. Vendor Owner ─────────────────────────────────
  console.log('🏪 [2/5] Creating vendor owner...')
  const vendorHash = await Bun.password.hash('vendor123', { algorithm: 'bcrypt', cost: 12 })
  await db
    .insert(users)
    .values({
      phone: '0900000002',
      email: 'vendor@sloco.vn',
      fullName: 'Nguyễn Văn Biển',
      role: 'vendor_owner',
      passwordHash: vendorHash,
    })
    .onConflictDoNothing()
  const [vendorOwner] = await db.select().from(users).where(eq(users.email, 'vendor@sloco.vn'))
  console.log(`   ✅ Vendor owner: ${vendorOwner?.email}`)

  if (!vendorOwner) {
    console.error('❌ Cannot create demo data: vendor owner not found')
    process.exit(1)
  }

  // ─── 3. Tourist ───────────────────────────────────────
  console.log('🧳 [3/5] Creating tourist user...')
  await db
    .insert(users)
    .values({
      phone: '0900000003',
      email: 'tourist@sloco.vn',
      fullName: 'Trần Minh Anh',
      role: 'tourist',
    })
    .onConflictDoNothing()
  const [tourist] = await db.select().from(users).where(eq(users.email, 'tourist@sloco.vn'))
  console.log(`   ✅ Tourist: ${tourist?.email}`)

  // ─── 4. Demo Vendor ───────────────────────────────────
  console.log('🏨 [4/5] Creating demo vendor...')
  const VENDOR_NAME = 'Nhà Hàng Hải Sản Biển Đông'
  await db
    .insert(vendors)
    .values({
      ownerId: vendorOwner.id,
      name: VENDOR_NAME,
      slug: slugify(VENDOR_NAME),
      description:
        'Nhà hàng hải sản tươi sống bên bờ biển Sầm Sơn, nổi tiếng với tôm hùm nướng phô mai và lẩu hải sản chua cay.',
      address: '123 Hồ Xuân Hương, Trung Sơn, Sầm Sơn, Thanh Hóa',
      latitude: '19.7569',
      longitude: '105.9011',
      phone: '0903000001',
      email: 'biepdong@sloco.vn',
      status: 'active',
      settlementType: 'periodic',
      settlementPeriodDays: 3,
      commissionRate: '8.00',
      ratingAvg: '4.50',
      reviewCount: 28,
      businessHours: {
        mon: '08:00-22:00',
        tue: '08:00-22:00',
        wed: '08:00-22:00',
        thu: '08:00-22:00',
        fri: '08:00-23:00',
        sat: '07:00-23:00',
        sun: '07:00-22:00',
      },
    })
    .onConflictDoNothing()
  const [demoVendor] = await db
    .select()
    .from(vendors)
    .where(eq(vendors.slug, slugify(VENDOR_NAME)))
  console.log(`   ✅ Demo vendor: ${demoVendor?.name}`)

  if (!demoVendor) {
    console.error('❌ Cannot create demo data: vendor not found')
    process.exit(1)
  }

  // ─── 5. Service Categories ────────────────────────────
  console.log('📂 [5/5] Fetching service categories...')
  const categories = await db.select().from(serviceCategories)
  console.log(`   ✅ ${categories.length} categories found`)
  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]))

  // ─── 6. Demo Services ─────────────────────────────────
  console.log('🎯 [6/5] Creating demo services...')
  const DEMO_SERVICES = [
    {
      categorySlug: 'am-thuc',
      name: 'Set Hải Sản 2 Người',
      slug: `${slugify(VENDOR_NAME)}-set-hai-san-2-nguoi`,
      desc: 'Tôm hùm, cua, ghẹ, ốc hương tươi sống — phí chế biến đã bao gồm',
      originalPrice: '450000',
      discountPrice: '380000',
      discountPercent: '15.56',
      durationMinutes: 60,
    },
    {
      categorySlug: 'am-thuc',
      name: 'Bún Cá Đặc Biệt',
      slug: `${slugify(VENDOR_NAME)}-bun-ca-dac-biet`,
      desc: 'Bún cá cay nước dùng hải sản đậm đà, đặc sản Sầm Sơn',
      originalPrice: '65000',
      discountPrice: '55000',
      discountPercent: '15.38',
      durationMinutes: 30,
    },
    {
      categorySlug: 'am-thuc',
      name: 'Combo Lẩu Hải Sản 4 Người',
      slug: `${slugify(VENDOR_NAME)}-combo-lau-hai-san-4-nguoi`,
      desc: 'Lẩu Tom Yum hải sản đầy đủ cho 4 người, bao gồm rau và đồ nhúng',
      originalPrice: '750000',
      discountPrice: '650000',
      discountPercent: '13.33',
      durationMinutes: 90,
    },
    {
      categorySlug: 'luu-tru',
      name: 'Phòng nghỉ view biển 1 đêm',
      slug: `${slugify(VENDOR_NAME)}-phong-nghi-view-bien-1-dem`,
      desc: 'Phòng nghỉ sạch sẽ gần biển, phù hợp nghỉ giữa lịch trình Sầm Sơn',
      originalPrice: '950000',
      discountPrice: '820000',
      discountPercent: '13.68',
      durationMinutes: 720,
    },
    {
      categorySlug: 'spa-massage',
      name: 'Massage chân thư giãn 45 phút',
      slug: `${slugify(VENDOR_NAME)}-massage-chan-thu-gian-45-phut`,
      desc: 'Liệu trình thư giãn sau khi tắm biển và di chuyển nhiều',
      originalPrice: '220000',
      discountPrice: '180000',
      discountPercent: '18.18',
      durationMinutes: 45,
    },
    {
      categorySlug: 'xe-dien',
      name: 'Tour xe điện dọc biển Sầm Sơn',
      slug: `${slugify(VENDOR_NAME)}-tour-xe-dien-doc-bien-sam-son`,
      desc: 'Di chuyển bằng xe điện qua các điểm nổi bật ven biển',
      originalPrice: '180000',
      discountPrice: '150000',
      discountPercent: '16.67',
      durationMinutes: 60,
    },
    {
      categorySlug: 'giai-tri',
      name: 'Vé khu vui chơi biển',
      slug: `${slugify(VENDOR_NAME)}-ve-khu-vui-choi-bien`,
      desc: 'Hoạt động giải trí buổi sáng hoặc buổi tối cho nhóm bạn và gia đình',
      originalPrice: '120000',
      discountPrice: '90000',
      discountPercent: '25.00',
      durationMinutes: 90,
    },
    {
      categorySlug: 'mua-sam',
      name: 'Voucher mua đặc sản Sầm Sơn',
      slug: `${slugify(VENDOR_NAME)}-voucher-mua-dac-san-sam-son`,
      desc: 'Ưu đãi mua quà địa phương, hải sản khô và đặc sản Thanh Hóa',
      originalPrice: '200000',
      discountPrice: '170000',
      discountPercent: '15.00',
      durationMinutes: 45,
    },
  ]

  const servicesToInsert = DEMO_SERVICES.flatMap((s) => {
    const categoryId = catMap[s.categorySlug]
    if (!categoryId) {
      console.log(`   ⚠️ ${s.categorySlug} category not found — skipping ${s.name}`)
      return []
    }

    return [
      {
        vendorId: demoVendor.id,
        categoryId,
        name: s.name,
        slug: s.slug,
        description: s.desc,
        originalPrice: s.originalPrice,
        discountPrice: s.discountPrice,
        discountPercent: s.discountPercent,
        durationMinutes: s.durationMinutes,
        isActive: true,
        images: [],
      },
    ]
  })

  if (servicesToInsert.length > 0) {
    const existingServices = await db
      .select()
      .from(services)
      .where(eq(services.vendorId, demoVendor.id))
    const existingSlugs = new Set(existingServices.map((service) => service.slug))
    const missingServices = servicesToInsert.filter((service) => !existingSlugs.has(service.slug))

    if (missingServices.length > 0) {
      await db.insert(services).values(missingServices)
    }

    const insertedSvcs = await db
      .select()
      .from(services)
      .where(eq(services.vendorId, demoVendor.id))
    console.log(`   ✅ ${insertedSvcs.length} demo services created`)

    // ─── 7. Sample Order ──────────────────────────────────
    if (insertedSvcs.length > 0 && tourist) {
      console.log('📦 [7/7] Creating sample order...')
      const [existingOrder] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.userId, tourist.id), eq(orders.status, 'paid')))
        .limit(1)
      const [order] = existingOrder
        ? [existingOrder]
        : await db
            .insert(orders)
            .values({
              userId: tourist.id,
              totalAmount: insertedSvcs[0]!.discountPrice || insertedSvcs[0]!.originalPrice,
              discountAmount: '0.00',
              finalAmount: insertedSvcs[0]!.discountPrice || insertedSvcs[0]!.originalPrice,
              status: 'paid',
              metadata: { source: 'seed', demo: true },
            })
            .returning()
      if (order) {
        console.log(`   ✅ Sample order: ${order.id} (status: ${order.status})`)
      }
    }
  } else {
    console.log('   ⚠️ No supported service categories found — run 01-categories.ts first')
  }

  // ─── Summary ─────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════')
  console.log('🎉 Demo data seed complete!')
  console.log('═══════════════════════════════════════════')
  console.log('Demo accounts:')
  console.log('   Admin:    admin@sloco.vn    / admin123')
  console.log('   Vendor:   vendor@sloco.vn   / vendor123')
  console.log('   Tourist:  tourist@sloco.vn  (OTP — no password)')
  console.log('═══════════════════════════════════════════\n')

  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
