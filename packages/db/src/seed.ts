import { createDb } from './index'
import { users } from './schema/users'
import { serviceCategories, services, vendors } from './schema/vendors'

async function seed() {
  console.log('🌱 Seeding database...')
  const db = createDb()

  // ─── 1. Service Categories ───────────────────────────
  console.log('  📂 Inserting service categories...')
  const categories = await db
    .insert(serviceCategories)
    .values([
      { name: 'Ẩm thực', slug: 'am-thuc', icon: '🍜', sortOrder: 1 },
      { name: 'Lưu trú', slug: 'luu-tru', icon: '🏨', sortOrder: 2 },
      { name: 'Spa & Massage', slug: 'spa-massage', icon: '💆', sortOrder: 3 },
      { name: 'Xe điện', slug: 'xe-dien', icon: '🛺', sortOrder: 4 },
      { name: 'Giải trí', slug: 'giai-tri', icon: '🎠', sortOrder: 5 },
      { name: 'Mua sắm', slug: 'mua-sam', icon: '🛍️', sortOrder: 6 },
    ])
    .onConflictDoNothing()
    .returning()
  console.log(`    ✅ ${categories.length} categories`)

  // ─── 2. Admin User ──────────────────────────────────
  console.log('  👤 Inserting admin user...')
  const adminPasswordHash = await Bun.password.hash('admin123', { algorithm: 'bcrypt', cost: 12 })
  const [adminUser] = await db
    .insert(users)
    .values({
      phone: '0900000000',
      email: 'admin@slocal.vn',
      fullName: 'S-Local Admin',
      role: 'admin',
      passwordHash: adminPasswordHash,
    })
    .onConflictDoNothing()
    .returning()
  console.log(`    ✅ Admin: ${adminUser?.email || 'already exists'}`)

  // ─── 3. Vendor Owner Users ──────────────────────────
  console.log('  👥 Inserting vendor owners...')
  const vendorPasswordHash = await Bun.password.hash('vendor123', { algorithm: 'bcrypt', cost: 12 })
  const vendorOwners = await db
    .insert(users)
    .values([
      { phone: '0901111111', email: 'vendor1@slocal.vn', fullName: 'Nguyễn Văn Biển', role: 'vendor_owner' as const, passwordHash: vendorPasswordHash },
      { phone: '0902222222', email: 'vendor2@slocal.vn', fullName: 'Trần Thị Hoa', role: 'vendor_owner' as const, passwordHash: vendorPasswordHash },
    ])
    .onConflictDoNothing()
    .returning()
  console.log(`    ✅ ${vendorOwners.length} vendor owners`)

  // ─── 4. Vendors ─────────────────────────────────────
  console.log('  🏪 Inserting vendors...')
  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]))
  const ownerId1 = vendorOwners[0]?.id || adminUser?.id
  const ownerId2 = vendorOwners[1]?.id || adminUser?.id

  if (!ownerId1 || !ownerId2) {
    console.log('    ⚠️ Skipping vendors — no owner IDs')
    process.exit(0)
  }

  const insertedVendors = await db
    .insert(vendors)
    .values([
      { ownerId: ownerId1, name: 'Nhà hàng Biển Xanh', slug: 'nha-hang-bien-xanh', description: 'Nhà hàng hải sản tươi sống view biển Sầm Sơn', address: '123 Hồ Xuân Hương, Sầm Sơn', latitude: '19.7460', longitude: '105.9000', phone: '0901111111', email: 'bienhxanh@slocal.vn', status: 'active' },
      { ownerId: ownerId1, name: 'Khách sạn Sầm Sơn Palace', slug: 'khach-san-sam-son-palace', description: 'Khách sạn 4 sao ngay bãi biển', address: '456 Trần Hưng Đạo, Sầm Sơn', latitude: '19.7500', longitude: '105.9050', phone: '0901111112', email: 'palace@slocal.vn', status: 'active' },
      { ownerId: ownerId2, name: 'Spa Hương Sen', slug: 'spa-huong-sen', description: 'Spa và massage thư giãn phong cách Việt', address: '789 Lê Lợi, Sầm Sơn', latitude: '19.7480', longitude: '105.9020', phone: '0902222221', email: 'huongsen@slocal.vn', status: 'active' },
      { ownerId: ownerId2, name: 'Xe điện Sầm Sơn Tour', slug: 'xe-dien-sam-son-tour', description: 'Tham quan Sầm Sơn bằng xe điện', address: 'Bãi biển Sầm Sơn', latitude: '19.7470', longitude: '105.9010', phone: '0902222222', email: 'xedien@slocal.vn', status: 'active' },
      { ownerId: ownerId1, name: 'Khu vui chơi Sầm Sơn Park', slug: 'khu-vui-choi-sam-son-park', description: 'Công viên giải trí ven biển', address: 'Khu du lịch Sầm Sơn', latitude: '19.7490', longitude: '105.9060', phone: '0901111113', email: 'park@slocal.vn', status: 'active' },
      { ownerId: ownerId2, name: 'Homestay Biển Gọi', slug: 'homestay-bien-goi', description: 'Homestay giá rẻ cho backpacker', address: '321 Nguyễn Du, Sầm Sơn', latitude: '19.7440', longitude: '105.8980', phone: '0902222223', email: 'biengoi@slocal.vn', status: 'active' },
      { ownerId: ownerId1, name: 'Quán Cà Phê Sóng', slug: 'quan-ca-phe-song', description: 'Café view biển, đồ uống đặc sản', address: '654 Hồ Xuân Hương, Sầm Sơn', latitude: '19.7455', longitude: '105.8990', phone: '0901111114', email: 'song@slocal.vn', status: 'active' },
      { ownerId: ownerId2, name: 'Shop Đặc Sản Thanh Hóa', slug: 'shop-dac-san-thanh-hoa', description: 'Đặc sản Thanh Hóa chính hãng', address: '987 Trần Phú, Sầm Sơn', latitude: '19.7510', longitude: '105.9070', phone: '0902222224', email: 'dacsan@slocal.vn', status: 'active' },
    ])
    .onConflictDoNothing()
    .returning()
  console.log(`    ✅ ${insertedVendors.length} vendors`)

  // ─── 5. Services ────────────────────────────────────
  console.log('  🎯 Inserting services...')
  const vendorMap = Object.fromEntries(insertedVendors.map((v) => [v.slug, v.id]))

  const serviceData = [
    // Nhà hàng Biển Xanh
    { vendorId: vendorMap['nha-hang-bien-xanh']!, categoryId: catMap['am-thuc']!, name: 'Set Hải Sản 2 Người', slug: 'set-hai-san-2-nguoi', description: 'Tôm hùm, cua, ghẹ, ốc hương tươi sống', originalPrice: '450000', discountPrice: '380000', discountPercent: '15.56' },
    { vendorId: vendorMap['nha-hang-bien-xanh']!, categoryId: catMap['am-thuc']!, name: 'Bún Hải Sản Đặc Biệt', slug: 'bun-hai-san-dac-biet', description: 'Bún tôm, mực, ghẹ nấu chua cay', originalPrice: '85000', discountPrice: '70000', discountPercent: '17.65' },
    // Spa Hương Sen
    { vendorId: vendorMap['spa-huong-sen']!, categoryId: catMap['spa-massage']!, name: 'Massage Toàn Thân 90 Phút', slug: 'massage-toan-than-90-phut', description: 'Massage thư giãn kết hợp tinh dầu', originalPrice: '350000', discountPrice: '280000', discountPercent: '20.00', durationMinutes: 90 },
    { vendorId: vendorMap['spa-huong-sen']!, categoryId: catMap['spa-massage']!, name: 'Gói Chăm Sóc Da Mặt', slug: 'goi-cham-soc-da-mat', description: 'Làm sạch, đắp mặt nạ, dưỡng ẩm', originalPrice: '250000', discountPrice: '200000', discountPercent: '20.00', durationMinutes: 60 },
    // Xe điện Sầm Sơn Tour
    { vendorId: vendorMap['xe-dien-sam-son-tour']!, categoryId: catMap['xe-dien']!, name: 'Tour Bãi Biển 30 Phút', slug: 'tour-bai-bien-30-phut', description: 'Tham quan dọc bờ biển Sầm Sơn', originalPrice: '50000', discountPrice: '40000', discountPercent: '20.00', durationMinutes: 30 },
    // Khu vui chơi
    { vendorId: vendorMap['khu-vui-choi-sam-son-park']!, categoryId: catMap['giai-tri']!, name: 'Vé Vào Cổng Người Lớn', slug: 've-vao-cong-nguoi-lon', description: 'Vé trọn gói các trò chơi', originalPrice: '150000', discountPrice: '120000', discountPercent: '20.00' },
    // Homestay
    { vendorId: vendorMap['homestay-bien-goi']!, categoryId: catMap['luu-tru']!, name: 'Phòng Đôi View Biển', slug: 'phong-doi-view-bien', description: 'Phòng 2 người có ban công nhìn biển', originalPrice: '500000', discountPrice: '400000', discountPercent: '20.00' },
    // Shop Đặc Sản
    { vendorId: vendorMap['shop-dac-san-thanh-hoa']!, categoryId: catMap['mua-sam']!, name: 'Nem Chua Thanh Hóa (hộp 20 cái)', slug: 'nem-chua-thanh-hoa', description: 'Nem chua truyền thống Thanh Hóa', originalPrice: '120000', discountPrice: '99000', discountPercent: '17.50' },
  ]

  const insertedServices = await db
    .insert(services)
    .values(serviceData.map((s) => ({ ...s, durationMinutes: (s as any).durationMinutes })))
    .onConflictDoNothing()
    .returning()
  console.log(`    ✅ ${insertedServices.length} services`)

  console.log('\n🎉 Seed completed!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
