import { eq } from 'drizzle-orm'
import { createDb } from './index'
import { articles } from './schema/content'
import { notifications } from './schema/notifications'
import { orderItems, orders, payments, vouchers } from './schema/orders'
import { reviews } from './schema/reviews'
import { users } from './schema/users'
import { serviceCategories, services, vendors } from './schema/vendors'

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function randomPicks<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function generateVoucherCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'VCH-'
  for (let i = 0; i < 6; i++) code += chars[randomInt(0, chars.length - 1)]
  return code
}

function generateQrToken(): string {
  return `qr_${crypto.randomUUID().replace(/-/g, '')}`
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

function daysFromNow(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

// ═══════════════════════════════════════════════════════════
//  GOOGLE MAPS DATA — Sầm Sơn, Thanh Hóa (pre-scraped)
//  Tên, địa chỉ, tọa độ lấy từ Google Maps thực tế
// ═══════════════════════════════════════════════════════════

const GOOGLE_MAPS_VENDORS = [
  // ── Ẩm thực ──────────────────────────────────────────
  { name: 'Nhà Hàng Hải Sản Biển Đông', address: '123 Hồ Xuân Hương, Trung Sơn, Sầm Sơn, Thanh Hóa', lat: '19.7569', lng: '105.9011', cat: 'am-thuc', desc: 'Nhà hàng hải sản tươi sống bên bờ biển, nổi tiếng với tôm hùm nướng phô mai và lẩu hải sản chua cay.' },
  { name: 'Quán Ốc Sầm Sơn', address: '45 Nguyễn Du, Trường Sơn, Sầm Sơn, Thanh Hóa', lat: '19.7523', lng: '105.9045', cat: 'am-thuc', desc: 'Quán ốc bình dân với hơn 30 loại ốc chế biến theo phong cách miền Trung.' },
  { name: 'Nhà Hàng Thanh Lịch', address: '67 Trần Hưng Đạo, Bắc Sơn, Sầm Sơn, Thanh Hóa', lat: '19.7501', lng: '105.9078', cat: 'am-thuc', desc: 'Nhà hàng phục vụ đặc sản Thanh Hóa: nem chua, chả rươi, bánh cuốn Thanh Hóa.' },
  { name: 'Quán Bún Cá Sầm Sơn', address: '89 Lê Lợi, Trung Sơn, Sầm Sơn, Thanh Hóa', lat: '19.7545', lng: '105.9033', cat: 'am-thuc', desc: 'Bún cá cay đặc sản Sầm Sơn, nước dùng ninh xương hải sản đậm đà.' },
  { name: 'The Beach House Restaurant', address: 'Bãi tắm B, Sầm Sơn, Thanh Hóa', lat: '19.7588', lng: '105.8998', cat: 'am-thuc', desc: 'Nhà hàng view biển cao cấp, phục vụ buffet hải sản và cocktail.' },

  // ── Lưu trú ──────────────────────────────────────────
  { name: 'FLC Grand Hotel Sầm Sơn', address: 'Khu du lịch FLC, Quảng Cư, Sầm Sơn, Thanh Hóa', lat: '19.7683', lng: '105.8823', cat: 'luu-tru', desc: 'Khách sạn 5 sao trong quần thể FLC với bể bơi vô cực, spa và sân golf 18 lỗ.' },
  { name: 'Ánh Phương Hotel', address: '234 Hồ Xuân Hương, Trung Sơn, Sầm Sơn, Thanh Hóa', lat: '19.7555', lng: '105.9021', cat: 'luu-tru', desc: 'Khách sạn 3 sao gần biển, phòng view biển thoáng mát, giá hợp lý cho gia đình.' },
  { name: 'Sầm Sơn Paradise Resort', address: '56 Trần Phú, Trường Sơn, Sầm Sơn, Thanh Hóa', lat: '19.7478', lng: '105.9089', cat: 'luu-tru', desc: 'Resort 4 sao với hồ bơi riêng, nhà hàng buffet và dịch vụ đưa đón sân bay.' },
  { name: 'Homestay Biển Xanh Sầm Sơn', address: '12 Ngõ 3, Trung Sơn, Sầm Sơn, Thanh Hóa', lat: '19.7532', lng: '105.9056', cat: 'luu-tru', desc: 'Homestay giá rẻ cho backpacker, phòng sạch sẽ, cách biển 200m.' },
  { name: 'Mường Thanh Luxury Sầm Sơn', address: '118 Lê Lợi, Trung Sơn, Sầm Sơn, Thanh Hóa', lat: '19.7561', lng: '105.9015', cat: 'luu-tru', desc: 'Khách sạn thuộc chuỗi Mường Thanh, 4 sao, tiện nghi đầy đủ, dịch vụ chuyên nghiệp.' },

  // ── Spa & Massage ────────────────────────────────────
  { name: 'Golden Lotus Spa', address: '78 Nguyễn Du, Trường Sơn, Sầm Sơn, Thanh Hóa', lat: '19.7515', lng: '105.9042', cat: 'spa-massage', desc: 'Spa cao cấp với liệu trình chăm sóc da mặt, massage đá nóng và tắm bùn khoáng.' },
  { name: 'Sầm Sơn Wellness Center', address: 'Tầng 2, FLC Grand Hotel, Sầm Sơn, Thanh Hóa', lat: '19.7685', lng: '105.8825', cat: 'spa-massage', desc: 'Trung tâm chăm sóc sức khỏe trong khu FLC với phòng xông hơi, bể sục và yoga.' },
  { name: 'Herbal Touch Massage', address: '145 Hồ Xuân Hương, Trung Sơn, Sầm Sơn, Thanh Hóa', lat: '19.7548', lng: '105.9029', cat: 'spa-massage', desc: 'Massage truyền thống Thái kết hợp thảo dược Việt, không gian yên tĩnh.' },

  // ── Xe điện ──────────────────────────────────────────
  { name: 'Sầm Sơn E-Car Tour', address: 'Bãi đỗ xe bãi tắm A, Sầm Sơn, Thanh Hóa', lat: '19.7575', lng: '105.9005', cat: 'xe-dien', desc: 'Tour xe điện tham quan bờ biển Sầm Sơn — Đền Độc Cước — Hòn Trống Mái.' },
  { name: 'Green Wheels Sầm Sơn', address: 'Quảng trường trung tâm, Sầm Sơn, Thanh Hóa', lat: '19.7560', lng: '105.9018', cat: 'xe-dien', desc: 'Cho thuê xe điện tự lái, xe đạp điện khám phá thành phố biển.' },

  // ── Giải trí ─────────────────────────────────────────
  { name: 'Sun World Sầm Sơn', address: 'Khu du lịch Sun World, Sầm Sơn, Thanh Hóa', lat: '19.7612', lng: '105.8967', cat: 'giai-tri', desc: 'Công viên giải trí lớn nhất Sầm Sơn với tàu lượn, đu quay và khu vui chơi nước.' },
  { name: 'FLC Zoo Safari', address: 'Khu du lịch FLC, Quảng Cư, Sầm Sơn, Thanh Hóa', lat: '19.7695', lng: '105.8810', cat: 'giai-tri', desc: 'Vườn thú bán hoang dã với hơn 100 loài động vật, trải nghiệm safari bằng xe điện.' },
  { name: 'Karaoke Star Sầm Sơn', address: '90 Trần Hưng Đạo, Bắc Sơn, Sầm Sơn, Thanh Hóa', lat: '19.7498', lng: '105.9082', cat: 'giai-tri', desc: 'Karaoke cao cấp 30 phòng, âm thanh hàng đầu, phục vụ đồ uống và snack.' },
  { name: 'Biển Sầm Sơn Jet Ski', address: 'Bãi tắm C, Sầm Sơn, Thanh Hóa', lat: '19.7600', lng: '105.8990', cat: 'giai-tri', desc: 'Cho thuê mô tô nước, dù kéo, banana boat — thể thao biển mạo hiểm.' },

  // ── Mua sắm ──────────────────────────────────────────
  { name: 'Chợ Hải Sản Sầm Sơn', address: 'Đường ven biển, Trung Sơn, Sầm Sơn, Thanh Hóa', lat: '19.7540', lng: '105.9038', cat: 'mua-sam', desc: 'Chợ hải sản tươi sống lớn nhất Sầm Sơn, mua về hoặc chế biến tại chỗ.' },
  { name: 'Đặc Sản Thanh Hóa - Cô Tâm', address: '167 Lê Lợi, Trung Sơn, Sầm Sơn, Thanh Hóa', lat: '19.7553', lng: '105.9025', cat: 'mua-sam', desc: 'Cửa hàng đặc sản Thanh Hóa: nem chua, chả tôm, mắm tôm, bánh gai.' },
  { name: 'Sầm Sơn Souvenir Shop', address: '34 Nguyễn Du, Trường Sơn, Sầm Sơn, Thanh Hóa', lat: '19.7520', lng: '105.9048', cat: 'mua-sam', desc: 'Quà lưu niệm biển: vỏ sò, san hô, áo phông, mũ nón du lịch Sầm Sơn.' },
]

// ═══════════════════════════════════════════════════════════
//  SERVICE TEMPLATES PER CATEGORY
// ═══════════════════════════════════════════════════════════

const SERVICE_TEMPLATES: Record<string, Array<{ name: string; desc: string; price: number; discountPrice: number; duration?: number }>> = {
  'am-thuc': [
    { name: 'Set Hải Sản 2 Người', desc: 'Tôm hùm, cua, ghẹ, ốc hương tươi sống', price: 450000, discountPrice: 380000 },
    { name: 'Bún Cá Đặc Biệt', desc: 'Bún cá cay nước dùng hải sản đậm đà', price: 65000, discountPrice: 55000 },
    { name: 'Set Lẩu Hải Sản 4 Người', desc: 'Lẩu Tom Yum hải sản đầy đủ cho 4 người', price: 750000, discountPrice: 650000 },
    { name: 'Combo Ốc Hương + Bia', desc: '1kg ốc hương xào tỏi + 4 lon bia', price: 320000, discountPrice: 270000 },
  ],
  'luu-tru': [
    { name: 'Phòng Đôi View Biển', desc: 'Phòng 2 người có ban công nhìn biển', price: 800000, discountPrice: 680000 },
    { name: 'Phòng Gia Đình 4 Người', desc: 'Phòng rộng cho gia đình, 2 giường đôi', price: 1200000, discountPrice: 1000000 },
    { name: 'Suite Cao Cấp', desc: 'Suite với phòng khách riêng, bồn tắm jacuzzi', price: 2500000, discountPrice: 2100000 },
  ],
  'spa-massage': [
    { name: 'Massage Toàn Thân 90 Phút', desc: 'Massage thư giãn kết hợp tinh dầu aromatherapy', price: 350000, discountPrice: 280000, duration: 90 },
    { name: 'Chăm Sóc Da Mặt Premium', desc: 'Làm sạch sâu, đắp mặt nạ vàng, dưỡng ẩm', price: 450000, discountPrice: 380000, duration: 60 },
    { name: 'Tắm Bùn Khoáng', desc: 'Ngâm bùn khoáng thiên nhiên, tốt cho sức khỏe', price: 300000, discountPrice: 250000, duration: 45 },
  ],
  'xe-dien': [
    { name: 'Tour Bờ Biển 30 Phút', desc: 'Tham quan dọc bờ biển Sầm Sơn bằng xe điện', price: 50000, discountPrice: 40000, duration: 30 },
    { name: 'Tour Đền Độc Cước 60 Phút', desc: 'Xe điện đi Đền Độc Cước + Hòn Trống Mái', price: 100000, discountPrice: 80000, duration: 60 },
    { name: 'Thuê Xe Tự Lái 2 Giờ', desc: 'Xe điện tự lái khám phá Sầm Sơn', price: 150000, discountPrice: 120000, duration: 120 },
  ],
  'giai-tri': [
    { name: 'Vé Vào Cổng Người Lớn', desc: 'Vé trọn gói các trò chơi tại công viên', price: 200000, discountPrice: 160000 },
    { name: 'Vé Vào Cổng Trẻ Em', desc: 'Vé trẻ em (dưới 1m3)', price: 120000, discountPrice: 95000 },
    { name: 'Combo Gia Đình (2 Lớn + 2 Nhỏ)', desc: 'Tiết kiệm 30% cho gia đình 4 người', price: 560000, discountPrice: 420000 },
    { name: 'Mô Tô Nước 15 Phút', desc: 'Lái jet ski trên biển Sầm Sơn', price: 300000, discountPrice: 250000, duration: 15 },
  ],
  'mua-sam': [
    { name: 'Nem Chua Thanh Hóa (20 cái)', desc: 'Nem chua truyền thống Thanh Hóa', price: 120000, discountPrice: 99000 },
    { name: 'Set Đặc Sản Quà Tặng', desc: 'Hộp quà gồm nem chua, chả tôm, mắm tôm', price: 350000, discountPrice: 290000 },
    { name: '1kg Mực Khô Loại 1', desc: 'Mực khô nguyên con, phơi tự nhiên', price: 450000, discountPrice: 380000 },
  ],
}

// ═══════════════════════════════════════════════════════════
//  TOURIST USERS
// ═══════════════════════════════════════════════════════════

const TOURIST_USERS = [
  { phone: '0912345001', fullName: 'Nguyễn Minh Tuấn' },
  { phone: '0912345002', fullName: 'Trần Thị Hương' },
  { phone: '0912345003', fullName: 'Lê Văn Đức' },
  { phone: '0912345004', fullName: 'Phạm Thị Mai' },
  { phone: '0912345005', fullName: 'Hoàng Anh Khoa' },
  { phone: '0912345006', fullName: 'Vũ Thị Lan' },
  { phone: '0912345007', fullName: 'Đỗ Quang Huy' },
  { phone: '0912345008', fullName: 'Bùi Thị Ngọc' },
  { phone: '0912345009', fullName: 'Ngô Văn Sơn' },
  { phone: '0912345010', fullName: 'Đặng Thị Thảo' },
  { phone: '0912345011', fullName: 'Đinh Công Minh' },
  { phone: '0912345012', fullName: 'Lý Thị Hoa' },
  { phone: '0912345013', fullName: 'Trịnh Văn Nam' },
  { phone: '0912345014', fullName: 'Phan Thị Yến' },
  { phone: '0912345015', fullName: 'Cao Đức Thành' },
  { phone: '0912345016', fullName: 'Tô Thị Bích' },
  { phone: '0912345017', fullName: 'Hà Văn Long' },
  { phone: '0912345018', fullName: 'Dương Thị Linh' },
  { phone: '0912345019', fullName: 'Lương Quốc Việt' },
  { phone: '0912345020', fullName: 'Mai Thị Hồng' },
]

// ═══════════════════════════════════════════════════════════
//  ARTICLES DATA
// ═══════════════════════════════════════════════════════════

const ARTICLES_DATA: Array<{ title: string; content: string; category: 'news' | 'event' | 'guide'; coverUrl: string }> = [
  // News
  { title: 'Sầm Sơn đón hơn 1 triệu lượt khách trong tháng 6', content: '<p>Theo thống kê từ UBND thành phố Sầm Sơn, riêng trong tháng 6/2026, thành phố biển đã đón hơn 1 triệu lượt khách du lịch, tăng 15% so với cùng kỳ năm trước.</p><p>Lượng khách tăng mạnh chủ yếu đến từ Hà Nội, Nghệ An và các tỉnh phía Bắc. Hệ thống khách sạn, nhà hàng hoạt động gần như hết công suất vào các dịp cuối tuần.</p><p>Ông Nguyễn Văn Phương - Phó Chủ tịch UBND TP Sầm Sơn cho biết: "Chúng tôi đang tập trung nâng cao chất lượng dịch vụ, đảm bảo an toàn vệ sinh thực phẩm và trật tự đô thị để phục vụ du khách tốt nhất."</p>', category: 'news', coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800' },
  { title: 'Khai trương tuyến đường đi bộ ven biển mới', content: '<p>Tuyến đường đi bộ ven biển dài 3km từ bãi tắm A đến Đền Độc Cước đã chính thức khai trương vào ngày 15/3/2026.</p><p>Tuyến đường được lát đá granite, có đèn LED chiếu sáng nghệ thuật và ghế nghỉ chân mỗi 200m. Dọc tuyến đường có các quầy bán đồ uống và quà lưu niệm.</p>', category: 'news', coverUrl: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800' },
  { title: 'Giải pháp chống chặt chém du khách tại Sầm Sơn', content: '<p>Sầm Sơn triển khai hệ thống niêm yết giá minh bạch tại 100% nhà hàng, khách sạn. Ứng dụng S-Loco ra đời giúp du khách mua voucher với giá cố định, tránh tình trạng "chặt chém".</p><p>Theo đại diện S-Loco: "Mỗi voucher đều được bảo đảm giá trên hệ thống. Khách mua trước — đến cơ sở quét QR là xong, không lo bị tính thêm phí."</p>', category: 'news', coverUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800' },
  { title: 'Hải sản Sầm Sơn vào mùa — giá giảm 20%', content: '<p>Mùa đánh bắt hải sản năm nay bắt đầu sớm hơn thường lệ. Ngư dân Sầm Sơn cho biết sản lượng tôm hùm, ghẹ, mực tăng mạnh, giá giảm 20-30% so với tháng trước.</p><p>Các nhà hàng hải sản trên S-Loco đã cập nhật menu với giá mới, nhiều combo hấp dẫn cho gia đình.</p>', category: 'news', coverUrl: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800' },
  { title: 'S-Loco hợp tác cùng 50 vendor mới', content: '<p>Sau 3 tháng hoạt động, nền tảng S-Loco đã ký kết hợp tác với thêm 50 nhà cung cấp dịch vụ mới tại Sầm Sơn, nâng tổng số vendor lên 80+.</p><p>Các vendor mới bao gồm nhà hàng, homestay, spa, dịch vụ thể thao biển và cửa hàng đặc sản. Du khách giờ đây có thêm nhiều lựa chọn với giá ưu đãi trên app.</p>', category: 'news', coverUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800' },

  // Events
  { title: 'Lễ hội Carnival Biển Sầm Sơn 2026', content: '<p>Lễ hội Carnival Biển Sầm Sơn 2026 sẽ diễn ra từ 28/4 đến 1/5 tại Quảng trường biển Sầm Sơn.</p><p>Chương trình bao gồm: diễu hành carnival với 1000 nghệ sĩ, đêm nhạc EDM bãi biển, cuộc thi xây lâu đài cát, và lễ hội ẩm thực hải sản với hơn 50 gian hàng.</p><p>Vé tham dự miễn phí. Đặt voucher dịch vụ trên S-Loco để nhận ưu đãi đặc biệt trong dịp lễ hội!</p>', category: 'event', coverUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800' },
  { title: 'Giải Chạy Marathon Bãi Biển Sầm Sơn', content: '<p>Giải Marathon Bãi Biển Sầm Sơn lần thứ 3 sẽ tổ chức vào ngày 15/4/2026 với các cự ly 5km, 10km, 21km và 42km.</p><p>Đường chạy dọc bờ biển Sầm Sơn tuyệt đẹp. Giải thưởng tổng trị giá 500 triệu đồng.</p><p>Đăng ký trên app S-Loco — nhận voucher giảm giá khách sạn và nhà hàng cho vận động viên!</p>', category: 'event', coverUrl: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800' },
  { title: 'Đêm Nhạc Acoustic Bên Bờ Biển', content: '<p>Mỗi tối thứ 7 hàng tuần, quảng trường biển Sầm Sơn tổ chức đêm nhạc acoustic miễn phí từ 19h-22h.</p><p>Các ban nhạc indie từ Hà Nội và địa phương biểu diễn, kết hợp với chợ đêm ẩm thực đường phố.</p>', category: 'event', coverUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800' },
  { title: 'Triển Lãm Ảnh "Sầm Sơn Qua Ống Kính"', content: '<p>Triển lãm ảnh nghệ thuật "Sầm Sơn Qua Ống Kính" trưng bày 100 tác phẩm của 30 nhiếp ảnh gia, diễn ra tại Trung tâm Văn hóa Sầm Sơn từ 1/4 đến 30/4/2026.</p><p>Chủ đề: Con người, biển cả và cuộc sống thường ngày tại Sầm Sơn.</p>', category: 'event', coverUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800' },
  { title: 'Hội Chợ Đặc Sản Thanh Hóa 2026', content: '<p>Hội chợ quy tụ hơn 200 gian hàng đặc sản từ 27 huyện thành phố Thanh Hóa. Du khách có cơ hội thưởng thức và mua các sản vật: nem chua, chả tôm, bánh gai, mắm tôm...</p><p>Thời gian: 10-15/5/2026 tại Quảng trường Lam Sơn, Sầm Sơn.</p>', category: 'event', coverUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800' },

  // Guides
  { title: 'Hướng dẫn du lịch Sầm Sơn 3 ngày 2 đêm', content: '<h2>Ngày 1 — Khám phá biển</h2><p>Sáng: Check-in khách sạn, tắm biển bãi A. Trưa: Ăn hải sản tại nhà hàng ven biển. Chiều: Xe điện tham quan Đền Độc Cước. Tối: Dạo phố đêm, ăn ốc.</p><h2>Ngày 2 — Trải nghiệm</h2><p>Sáng: Spa massage thư giãn. Trưa: Buffet tại resort. Chiều: Công viên giải trí Sun World. Tối: Đêm nhạc bãi biển.</p><h2>Ngày 3 — Mua sắm</h2><p>Sáng: Chợ hải sản. Trưa: Bún cá Sầm Sơn. Chiều: Mua đặc sản về làm quà. Check-out.</p>', category: 'guide', coverUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800' },
  { title: 'Top 10 quán hải sản ngon nhất Sầm Sơn', content: '<p>Bài viết tổng hợp 10 nhà hàng hải sản được du khách đánh giá cao nhất trên S-Loco, kèm theo giá trung bình và món đặc trưng của mỗi quán.</p><ol><li>Nhà Hàng Hải Sản Biển Đông — Set hải sản 2 người chỉ 380,000₫</li><li>Quán Ốc Sầm Sơn — 30+ loại ốc, giá từ 50,000₫/đĩa</li><li>The Beach House — Buffet hải sản view biển</li></ol>', category: 'guide', coverUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800' },
  { title: 'Bí kíp tiết kiệm khi du lịch Sầm Sơn', content: '<p>Du lịch Sầm Sơn không hề đắt nếu bạn biết cách! Dưới đây là 7 mẹo tiết kiệm:</p><ol><li>Mua voucher trên S-Loco — giảm 5-20% so với giá tại quầy</li><li>Đặt homestay thay vì khách sạn — tiết kiệm 50% tiền phòng</li><li>Ăn sáng tại quán địa phương — phở, bún chỉ 30-40k</li><li>Đi xe điện thay taxi — rẻ hơn 5 lần</li><li>Mua hải sản ở chợ, nhờ nhà hàng chế biến — tiết kiệm 40%</li><li>Đi giữa tuần — giá phòng giảm 30-50%</li><li>Combo gia đình trên S-Loco — tiết kiệm thêm 15%</li></ol>', category: 'guide', coverUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800' },
  { title: 'Cẩm nang di chuyển đến Sầm Sơn', content: '<h2>Từ Hà Nội</h2><p>Xe khách: 3.5h, giá 120-150k. Xuất phát từ bến Giáp Bát hoặc Mỹ Đình.</p><p>Xe riêng: 3h đi cao tốc Mai Sơn — QL1A.</p><p>Tàu hỏa: 3.5h đến ga Thanh Hóa, sau đó taxi 16km đến Sầm Sơn (~100k).</p><h2>Từ Sân bay Thọ Xuân</h2><p>Cách Sầm Sơn 60km, taxi ~400k hoặc xe bus 80k.</p><h2>Di chuyển trong Sầm Sơn</h2><p>Xe điện tour: Booking trên S-Loco. Grab/taxi: Phổ biến. Xe đạp: Nhiều điểm cho thuê.</p>', category: 'guide', coverUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800' },
  { title: 'Các điểm check-in đẹp nhất Sầm Sơn', content: '<p>Sầm Sơn không chỉ có biển! 8 điểm check-in sống ảo đẹp nhất:</p><ol><li>Đền Độc Cước — hoàng hôn tuyệt đẹp</li><li>Hòn Trống Mái — biểu tượng Sầm Sơn</li><li>Quảng trường biển — đèn LED ban đêm</li><li>Cầu cảng cá — chụp ảnh ngư dân</li><li>FLC Golf Links — sân golf view biển</li><li>Đường hoa ven biển — mùa phượng vĩ</li><li>Núi Trường Lệ — panorama thành phố</li><li>Bãi đá Ghềnh — sóng vỗ đá hoang sơ</li></ol>', category: 'guide', coverUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800' },
]

// ═══════════════════════════════════════════════════════════
//  REVIEW COMMENTS
// ═══════════════════════════════════════════════════════════

const REVIEW_COMMENTS = [
  'Rất tuyệt vời! Sẽ quay lại lần sau.',
  'Dịch vụ tốt, nhân viên thân thiện.',
  'Giá cả hợp lý, chất lượng ổn.',
  'Hải sản tươi ngon, view biển đẹp.',
  'Phòng sạch sẽ, tiện nghi đầy đủ.',
  'Massage rất thư giãn, tay nghề cao.',
  'Xe điện tiện lợi, tài xế vui tính.',
  'Công viên vui chơi nhiều trò, con thích lắm!',
  'Nem chua ngon, đóng gói cẩn thận.',
  'Wifi mạnh, phục vụ nhanh.',
  'Vị trí đẹp, gần biển, đi bộ 2 phút.',
  'Đồ ăn ngon nhưng hơi đông, phải chờ.',
  'Staff rất nhiệt tình hỗ trợ.',
  'Giá trên app đúng với thực tế, rất minh bạch.',
  'Không gian yên tĩnh, thích hợp nghỉ dưỡng.',
  'Trải nghiệm jet ski rất đã, muốn đi thêm!',
  'Món chả tôm ở đây ngon nhất Sầm Sơn!',
  'View từ phòng rất đẹp, đặc biệt lúc hoàng hôn.',
  'Giá vé gia đình tiết kiệm, rất đáng!',
  'Quà tặng đóng gói đẹp, bạn bè rất thích.',
]

// ═══════════════════════════════════════════════════════════
//  MAIN SEED
// ═══════════════════════════════════════════════════════════

async function seed() {
  console.log('🌱 Seeding database with comprehensive demo data...\n')
  const db = createDb()

  // ─── 1. Service Categories ───────────────────────────
  // ─── 0. Clean transactional data ─────────────────────
  console.log('🧹 [0/8] Cleaning old transactional data...')
  await db.delete(notifications)
  await db.delete(reviews)
  await db.delete(payments)
  await db.delete(vouchers)
  await db.delete(orderItems)
  await db.delete(orders)
  await db.delete(articles)
  console.log('   ✅ Cleaned orders, vouchers, payments, reviews, articles, notifications\n')

  console.log('📂 [1/8] Service Categories...')
  await db
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
  // Always query to get IDs (handles both fresh and re-run)
  const allCategories = await db.select().from(serviceCategories)
  const catMap = Object.fromEntries(allCategories.map((c) => [c.slug, c.id]))
  console.log(`   ✅ ${allCategories.length} categories\n`)

  // ─── 2. Admin + Vendor Owner Users ───────────────────
  console.log('👤 [2/8] Users (admin + vendor owners + tourists)...')
  const adminHash = await Bun.password.hash('admin123', { algorithm: 'bcrypt', cost: 12 })
  const vendorHash = await Bun.password.hash('vendor123', { algorithm: 'bcrypt', cost: 12 })

  await db
    .insert(users)
    .values({
      phone: '0900000000',
      email: 'admin@sloco.vn',
      fullName: 'S-Loco Admin',
      role: 'admin',
      passwordHash: adminHash,
    })
    .onConflictDoNothing()
  const [adminUser] = await db.select().from(users).where(eq(users.email, 'admin@sloco.vn'))
  console.log(`   ✅ Admin: ${adminUser?.email || 'error'}`)

  // 5 vendor owners
  const vendorOwnerData = [
    { phone: '0900000002', email: 'vendor@sloco.vn', fullName: 'Nguyễn Văn Biển', role: 'vendor_owner' as const, passwordHash: vendorHash },
    { phone: '0901111111', email: 'vendor1@sloco.vn', fullName: 'Nguyễn Văn Biển', role: 'vendor_owner' as const, passwordHash: vendorHash },
    { phone: '0901111112', email: 'vendor2@sloco.vn', fullName: 'Trần Thị Hoa', role: 'vendor_owner' as const, passwordHash: vendorHash },
    { phone: '0901111113', email: 'vendor3@sloco.vn', fullName: 'Lê Quang Vinh', role: 'vendor_owner' as const, passwordHash: vendorHash },
    { phone: '0901111114', email: 'vendor4@sloco.vn', fullName: 'Phạm Thị Thu', role: 'vendor_owner' as const, passwordHash: vendorHash },
    { phone: '0901111115', email: 'vendor5@sloco.vn', fullName: 'Hoàng Đức Mạnh', role: 'vendor_owner' as const, passwordHash: vendorHash },
  ]
  await db.insert(users).values(vendorOwnerData).onConflictDoNothing()
  const vendorOwners = await db.select().from(users).where(eq(users.role, 'vendor_owner'))
  console.log(`   ✅ ${vendorOwners.length} vendor owners`)

  // 20 tourist users
  await db
    .insert(users)
    .values(TOURIST_USERS.map((t) => ({ ...t, role: 'tourist' as const })))
    .onConflictDoNothing()
  const touristUsers = await db.select().from(users).where(eq(users.role, 'tourist'))
  console.log(`   ✅ ${touristUsers.length} tourist users\n`)

  // ─── 3. Vendors from Google Maps Data ────────────────
  console.log('🏪 [3/8] Vendors (Google Maps data — Sầm Sơn)...')
  const ownerIds = vendorOwners.map((v) => v.id)

  const vendorValues = GOOGLE_MAPS_VENDORS.map((v, idx) => ({
    ownerId: ownerIds[idx % ownerIds.length]!,
    name: v.name,
    slug: slugify(v.name),
    description: v.desc,
    address: v.address,
    latitude: v.lat,
    longitude: v.lng,
    phone: `090${String(3000000 + idx).padStart(7, '0')}`,
    email: `${slugify(v.name).slice(0, 15)}@sloco.vn`,
    status: 'active' as const,
    ratingAvg: String((3.5 + Math.random() * 1.5).toFixed(2)),
    reviewCount: randomInt(5, 50),
    businessHours: { mon: '08:00-22:00', tue: '08:00-22:00', wed: '08:00-22:00', thu: '08:00-22:00', fri: '08:00-23:00', sat: '07:00-23:00', sun: '07:00-22:00' },
  }))
  await db.insert(vendors).values(vendorValues).onConflictDoNothing()

  const [defaultVendorOwner] = await db
    .select()
    .from(users)
    .where(eq(users.email, 'vendor@sloco.vn'))
  if (defaultVendorOwner) {
    await db
      .update(vendors)
      .set({ ownerId: defaultVendorOwner.id })
      .where(eq(vendors.slug, 'nha-hang-hai-san-bien-dong'))
  }

  const insertedVendors = await db.select().from(vendors).where(eq(vendors.status, 'active'))
  console.log(`   ✅ ${insertedVendors.length} vendors\n`)

  // Build vendor map: slug → { id, category } using slug match to GOOGLE_MAPS_VENDORS
  const vendorCatMap = new Map<string, { id: string; cat: string }>()
  const gmSlugToCategory = new Map(GOOGLE_MAPS_VENDORS.map((v) => [slugify(v.name), v.cat]))
  for (const vendor of insertedVendors) {
    const cat = gmSlugToCategory.get(vendor.slug)
    if (cat) {
      vendorCatMap.set(vendor.id, { id: vendor.id, cat })
    }
  }

  // ─── 4. Services ─────────────────────────────────────
  console.log('🎯 [4/8] Services...')
  const allServiceValues: Array<{
    vendorId: string
    categoryId: string
    name: string
    slug: string
    description: string
    originalPrice: string
    discountPrice: string
    discountPercent: string
    durationMinutes?: number
  }> = []

  for (const vendor of insertedVendors) {
    const info = vendorCatMap.get(vendor.id)
    if (!info) continue
    const templates = SERVICE_TEMPLATES[info.cat]
    if (!templates) continue

    // Pick 2-3 services per vendor
    const selectedTemplates = randomPicks(templates, randomInt(2, Math.min(3, templates.length)))
    for (const tpl of selectedTemplates) {
      const discountPercent = (((tpl.price - tpl.discountPrice) / tpl.price) * 100).toFixed(2)
      allServiceValues.push({
        vendorId: vendor.id,
        categoryId: catMap[info.cat]!,
        name: tpl.name,
        slug: `${slugify(vendor.name)}-${slugify(tpl.name)}`,
        description: tpl.desc,
        originalPrice: String(tpl.price),
        discountPrice: String(tpl.discountPrice),
        discountPercent,
        durationMinutes: tpl.duration,
      })
    }
  }

  if (allServiceValues.length > 0) {
    await db.insert(services).values(allServiceValues).onConflictDoNothing()
  }
  const insertedServices = await db.select().from(services).where(eq(services.isActive, true))
  console.log(`   ✅ ${insertedServices.length} services\n`)

  // ─── 5. Orders + Order Items + Vouchers + Payments ───
  console.log('📦 [5/8] Orders, Order Items, Vouchers & Payments (~100 orders)...')
  const touristIds = touristUsers.map((t) => t.id)
  const gateways: Array<'vnpay' | 'momo' | 'sepay'> = ['vnpay', 'momo', 'sepay']

  let totalOrders = 0
  let totalOrderItems = 0
  let totalVouchers = 0
  let totalPayments = 0
  const usedVoucherCodes = new Set<string>()
  const completedVoucherIds: string[] = []

  // Track which tourist-service combos have vouchers completed (for reviews)
  const completedBookings: Array<{ userId: string; vendorId: string; serviceId: string; voucherId: string }> = []

  for (let i = 0; i < 100; i++) {
    const userId = randomPick(touristIds)!
    const numItems = randomInt(1, 3)
    const selectedServices = randomPicks(insertedServices, numItems)

    let subtotal = 0
    const items: Array<{
      serviceId: string
      vendorId: string
      quantity: number
      unitPrice: string
      totalPrice: string
      serviceSnapshot: object
    }> = []

    for (const svc of selectedServices) {
      const qty = randomInt(1, 2)
      const price = Number(svc.discountPrice || svc.originalPrice)
      const itemTotal = price * qty
      subtotal += itemTotal
      items.push({
        serviceId: svc.id,
        vendorId: svc.vendorId,
        quantity: qty,
        unitPrice: String(price),
        totalPrice: String(itemTotal),
        serviceSnapshot: { name: svc.name, price: svc.originalPrice, discountPrice: svc.discountPrice },
      })
    }

    // Determine order status distribution
    const statusRoll = Math.random()
    let orderStatus: 'created' | 'paid' | 'cancelled' | 'refunded'
    if (statusRoll < 0.15) orderStatus = 'created'
    else if (statusRoll < 0.85) orderStatus = 'paid'
    else if (statusRoll < 0.93) orderStatus = 'cancelled'
    else orderStatus = 'refunded'

    const createdDaysAgo = randomInt(1, 60)

    // Insert order
    const [order] = await db
      .insert(orders)
      .values({
        userId,
        totalAmount: String(subtotal),
        discountAmount: '0.00',
        finalAmount: String(subtotal),
        status: orderStatus,
        createdAt: daysAgo(createdDaysAgo),
        updatedAt: daysAgo(createdDaysAgo),
      })
      .returning()

    if (!order) continue
    totalOrders++

    // Insert order items
    const insertedItems = await db
      .insert(orderItems)
      .values(items.map((item) => ({ orderId: order.id, ...item })))
      .returning()
    totalOrderItems += insertedItems.length

    // Insert vouchers for each order item
    for (const item of insertedItems) {
      for (let q = 0; q < item.quantity; q++) {
        let code: string
        do {
          code = generateVoucherCode()
        } while (usedVoucherCodes.has(code))
        usedVoucherCodes.add(code)

        // Voucher status depends on order status
        let voucherStatus: 'created' | 'paid' | 'redeemed' | 'completed' | 'settled' | 'cancelled' | 'expired' | 'refunded'
        let redeemedAt: Date | undefined
        let completedAt: Date | undefined
        let settledAt: Date | undefined

        if (orderStatus === 'cancelled') {
          voucherStatus = 'cancelled'
        } else if (orderStatus === 'refunded') {
          voucherStatus = 'refunded'
        } else if (orderStatus === 'created') {
          voucherStatus = 'created'
        } else {
          // paid order — voucher lifecycle
          const vRoll = Math.random()
          if (vRoll < 0.25) {
            voucherStatus = 'paid'
          } else if (vRoll < 0.40) {
            voucherStatus = 'redeemed'
            redeemedAt = daysAgo(createdDaysAgo - randomInt(0, 3))
          } else if (vRoll < 0.70) {
            voucherStatus = 'completed'
            redeemedAt = daysAgo(createdDaysAgo - randomInt(0, 2))
            completedAt = daysAgo(createdDaysAgo - randomInt(0, 1))
          } else {
            voucherStatus = 'settled'
            redeemedAt = daysAgo(createdDaysAgo - 2)
            completedAt = daysAgo(createdDaysAgo - 1)
            settledAt = daysAgo(createdDaysAgo)
          }
        }

        const [insertedVoucher] = await db
          .insert(vouchers)
          .values({
            orderItemId: item.id,
            userId,
            vendorId: item.vendorId,
            serviceId: item.serviceId,
            code,
            qrToken: generateQrToken(),
            status: voucherStatus,
            redeemedAt,
            completedAt,
            settledAt,
            expiresAt: daysFromNow(randomInt(7, 90)),
          })
          .returning()
        totalVouchers++

        // Track completed/settled vouchers for reviews
        if ((voucherStatus === 'completed' || voucherStatus === 'settled') && insertedVoucher) {
          completedVoucherIds.push(insertedVoucher.id)
          completedBookings.push({
            userId,
            vendorId: item.vendorId,
            serviceId: item.serviceId,
            voucherId: insertedVoucher.id,
          })
        }
      }
    }

    // Insert payment for non-created orders
    if (orderStatus !== 'created') {
      const paymentStatus = orderStatus === 'cancelled' ? ('failed' as const) : orderStatus === 'refunded' ? ('refunded' as const) : ('success' as const)
      await db.insert(payments).values({
        orderId: order.id,
        gateway: randomPick(gateways)!,
        gatewayTransactionId: `TXN-${Date.now()}-${randomInt(1000, 9999)}`,
        amount: String(subtotal),
        status: paymentStatus,
        idempotencyKey: `idem-${crypto.randomUUID()}`,
        paidAt: paymentStatus === 'success' ? daysAgo(createdDaysAgo) : undefined,
      })
      totalPayments++
    }
  }

  console.log(`   ✅ ${totalOrders} orders`)
  console.log(`   ✅ ${totalOrderItems} order items`)
  console.log(`   ✅ ${totalVouchers} vouchers`)
  console.log(`   ✅ ${totalPayments} payments\n`)

  // ─── 6. Reviews ──────────────────────────────────────
  console.log('⭐ [6/8] Reviews...')
  const reviewValues = completedBookings.slice(0, 60).map((booking) => ({
    userId: booking.userId,
    vendorId: booking.vendorId,
    serviceId: booking.serviceId,
    voucherId: booking.voucherId,
    rating: randomInt(3, 5),
    comment: randomPick(REVIEW_COMMENTS)!,
  }))

  let insertedReviews = 0
  if (reviewValues.length > 0) {
    const result = await db.insert(reviews).values(reviewValues).onConflictDoNothing().returning()
    insertedReviews = result.length
  }
  console.log(`   ✅ ${insertedReviews} reviews\n`)

  // ─── 7. Articles ─────────────────────────────────────
  console.log('📰 [7/8] Articles...')
  const authorId = adminUser?.id || vendorOwners[0]?.id
  if (authorId) {
    const articleValues = ARTICLES_DATA.map((a, idx) => ({
      title: a.title,
      slug: slugify(a.title),
      content: a.content,
      coverImageUrl: a.coverUrl,
      category: a.category,
      isPublished: true,
      publishedAt: daysAgo(randomInt(1, 30)),
      authorId,
    }))
    const insertedArticles = await db.insert(articles).values(articleValues).onConflictDoNothing().returning()
    console.log(`   ✅ ${insertedArticles.length} articles\n`)
  } else {
    console.log('   ⚠️ Skipped — no author ID\n')
  }

  // ─── 8. Notifications ────────────────────────────────
  console.log('🔔 [8/8] Notifications...')
  const notifTypes = [
    { type: 'order', title: 'Đơn hàng mới', body: 'Bạn có đơn hàng mới cần xử lý' },
    { type: 'voucher', title: 'Voucher đã sử dụng', body: 'Khách hàng vừa sử dụng voucher tại cơ sở của bạn' },
    { type: 'settlement', title: 'Đối soát hoàn tất', body: 'Khoản thanh toán đã được chuyển vào tài khoản' },
    { type: 'system', title: 'Chào mừng đến S-Loco!', body: 'Cảm ơn bạn đã sử dụng S-Loco. Khám phá ngay các ưu đãi!' },
    { type: 'promo', title: 'Ưu đãi cuối tuần', body: 'Giảm 20% tất cả dịch vụ spa cuối tuần này!' },
    { type: 'order', title: 'Đơn hàng đã thanh toán', body: 'Đơn hàng của bạn đã thanh toán thành công. Kiểm tra voucher!' },
    { type: 'system', title: 'Cập nhật ứng dụng', body: 'Phiên bản mới với nhiều tính năng hấp dẫn đã sẵn sàng!' },
  ]

  const allUsers = [...touristUsers, ...vendorOwners]
  const notifValues = Array.from({ length: 50 }, () => {
    const notif = randomPick(notifTypes)!
    return {
      userId: randomPick(allUsers)!.id,
      type: notif.type,
      title: notif.title,
      body: notif.body,
      isRead: Math.random() > 0.6,
      createdAt: daysAgo(randomInt(0, 14)),
    }
  })

  const insertedNotifs = await db.insert(notifications).values(notifValues).onConflictDoNothing().returning()
  console.log(`   ✅ ${insertedNotifs.length} notifications\n`)

  // ─── Summary ─────────────────────────────────────────
  console.log('═══════════════════════════════════════════')
  console.log('🎉 Seed completed! Summary:')
  console.log(`   📂 ${allCategories.length} categories`)
  console.log(`   👤 1 admin + ${vendorOwners.length} vendor owners + ${touristUsers.length} tourists`)
  console.log(`   🏪 ${insertedVendors.length} vendors (Google Maps data)`)
  console.log(`   🎯 ${insertedServices.length} services`)
  console.log(`   📦 ${totalOrders} orders → ${totalOrderItems} items`)
  console.log(`   🎫 ${totalVouchers} vouchers`)
  console.log(`   💳 ${totalPayments} payments`)
  console.log(`   ⭐ ${insertedReviews} reviews`)
  console.log(`   📰 ${ARTICLES_DATA.length} articles`)
  console.log(`   🔔 ${insertedNotifs.length} notifications`)
  console.log('═══════════════════════════════════════════\n')

  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
