/**
 * seeds/02-demo-data.ts
 * Seed demo data for S-Loco: admin, vendor owner, tourist user,
 * 1 demo vendor, services, sample orders/vouchers.
 * Run: bun run packages/db/seeds/02-demo-data.ts
 * (Run 01-categories.ts first to ensure categories exist)
 */

import { eq } from 'drizzle-orm'
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
  await db.insert(users).values({
    phone: '0900000001',
    email: 'admin@slocal.vn',
    fullName: 'S-Local Admin',
    role: 'admin',
    passwordHash: adminHash,
  }).onConflictDoNothing()
  const [admin] = await db.select().from(users).where(eq(users.email, 'admin@slocal.vn'))
  console.log(`   ✅ Admin: ${admin?.email}`)

  // ─── 2. Vendor Owner ─────────────────────────────────
  console.log('🏪 [2/5] Creating vendor owner...')
  const vendorHash = await Bun.password.hash('vendor123', { algorithm: 'bcrypt', cost: 12 })
  await db.insert(users).values({
    phone: '0900000002',
    email: 'vendor@slocal.vn',
    fullName: 'Nguyễn Văn Biển',
    role: 'vendor_owner',
    passwordHash: vendorHash,
  }).onConflictDoNothing()
  const [vendorOwner] = await db.select().from(users).where(eq(users.email, 'vendor@slocal.vn'))
  console.log(`   ✅ Vendor owner: ${vendorOwner?.email}`)

  if (!vendorOwner) {
    console.error('❌ Cannot create demo data: vendor owner not found')
    process.exit(1)
  }

  // ─── 3. Tourist ───────────────────────────────────────
  console.log('🧳 [3/5] Creating tourist user...')
  await db.insert(users).values({
    phone: '0900000003',
    email: 'tourist@slocal.vn',
    fullName: 'Trần Minh Anh',
    role: 'tourist',
  }).onConflictDoNothing()
  const [tourist] = await db.select().from(users).where(eq(users.email, 'tourist@slocal.vn'))
  console.log(`   ✅ Tourist: ${tourist?.email}`)

  // ─── 4. Demo Vendor ───────────────────────────────────
  console.log('🏨 [4/5] Creating demo vendor...')
  const VENDOR_NAME = 'Nhà Hàng Hải Sản Biển Đông'
  await db.insert(vendors).values({
    ownerId: vendorOwner.id,
    name: VENDOR_NAME,
    slug: slugify(VENDOR_NAME),
    description: 'Nhà hàng hải sản tươi sống bên bờ biển Sầm Sơn, nổi tiếng với tôm hùm nướng phô mai và lẩu hải sản chua cay.',
    address: '123 Hồ Xuân Hương, Trung Sơn, Sầm Sơn, Thanh Hóa',
    latitude: '19.7569',
    longitude: '105.9011',
    phone: '0903000001',
    email: 'biepdong@slocal.vn',
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
  }).onConflictDoNothing()
  const [demoVendor] = await db.select().from(vendors).where(eq(vendors.slug, slugify(VENDOR_NAME)))
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
  const amThucCatId = catMap['am-thuc']
  if (amThucCatId) {
    const DEMO_SERVICES = [
      {
        name: 'Set Hải Sản 2 Người',
        slug: `${slugify(VENDOR_NAME)}-set-hai-san-2-nguoi`,
        desc: 'Tôm hùm, cua, ghẹ, ốc hương tươi sống — phí chế biến đã bao gồm',
        originalPrice: '450000',
        discountPrice: '380000',
        discountPercent: '15.56',
        durationMinutes: 60,
      },
      {
        name: 'Bún Cá Đặc Biệt',
        slug: `${slugify(VENDOR_NAME)}-bun-ca-dac-biet`,
        desc: 'Bún cá cay nước dùng hải sản đậm đà, đặc sản Sầm Sơn',
        originalPrice: '65000',
        discountPrice: '55000',
        discountPercent: '15.38',
        durationMinutes: 30,
      },
      {
        name: 'Combo Lẩu Hải Sản 4 Người',
        slug: `${slugify(VENDOR_NAME)}-combo-lau-hai-san-4-nguoi`,
        desc: 'Lẩu Tom Yum hải sản đầy đủ cho 4 người, bao gồm rau và đồ nhúng',
        originalPrice: '750000',
        discountPrice: '650000',
        discountPercent: '13.33',
        durationMinutes: 90,
      },
    ]

    await db.insert(services).values(
      DEMO_SERVICES.map((s) => ({
        vendorId: demoVendor.id,
        categoryId: amThucCatId,
        name: s.name,
        slug: s.slug,
        description: s.desc,
        originalPrice: s.originalPrice,
        discountPrice: s.discountPrice,
        discountPercent: s.discountPercent,
        durationMinutes: s.durationMinutes,
        isActive: true,
        images: [],
      })),
    ).onConflictDoNothing()

    const insertedSvcs = await db.select().from(services).where(eq(services.vendorId, demoVendor.id))
    console.log(`   ✅ ${insertedSvcs.length} demo services created`)

    // ─── 7. Sample Order ──────────────────────────────────
    if (insertedSvcs.length > 0 && tourist) {
      console.log('📦 [7/7] Creating sample order...')
      const orderNumber = `SL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(1).padStart(4, '0')}`
      const svc = insertedSvcs[0]!
      const amount = svc.discountPrice || svc.originalPrice

      await db.insert(orders).values({
        orderNumber,
        userId: tourist.id,
        totalAmount: amount,
        discountAmount: '0.00',
        finalAmount: amount,
        status: 'paid',
        metadata: { source: 'seed', demo: true },
      }).onConflictDoNothing()

      const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber))
      if (order) {
        console.log(`   ✅ Sample order: ${order.orderNumber} (status: ${order.status})`)
      }
    }
  } else {
    console.log('   ⚠️ am-thuc category not found — run 01-categories.ts first')
  }

  // ─── Summary ─────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════')
  console.log('🎉 Demo data seed complete!')
  console.log('═══════════════════════════════════════════')
  console.log('Demo accounts:')
  console.log('   Admin:    admin@slocal.vn    / admin123')
  console.log('   Vendor:   vendor@slocal.vn   / vendor123')
  console.log('   Tourist:  tourist@slocal.vn  (OTP — no password)')
  console.log('═══════════════════════════════════════════\n')

  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
