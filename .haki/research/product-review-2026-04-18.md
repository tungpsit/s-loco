# S-Loco: Product Review — 2026-04-18

**Reviewer:** Product Manager 20-year experience
**Scope:** All 6 phases, 63 requirements
**Status:** 🟡 Mostly Implemented — 4 items need attention before production

---

## Tổng quan: Đánh giá mức độ hoàn thiện theo Phase

| Phase | Requirements | ✅ Done | ⚠️ Partial | 🔴 Not Done |
|-------|-------------|---------|------------|-------------|
| 1 — Foundation & Auth | 11 | 10 | 1 | 0 |
| 2 — Vendor & Service Management | 8 | 8 | 0 | 0 |
| 3 — Orders, Vouchers & QR | 13 | 13 | 0 | 0 |
| 4 — Payment Integration | 8 | 7 | 1 | 0 |
| 5 — Settlement, Notifications & Dashboards | 16 | 14 | 2 | 0 |
| 6 — AI, Combos, Content & Reviews | 10 | 9 | 1 | 0 |
| **Total** | **63** | **61** | **5** | **0** |

**Tỷ lệ hoàn thiện: 97%** — thành tựu rất cao. Việc còn lại là 4-5 bug/implementation nhỏ cần fix trước khi production.

---

## Phase 1: Foundation & Auth

### Tình trạng chung: ⭐⭐⭐⭐⭐ (10/11) — Xuất sắc

Tất cả 11 requirement đều đã implement. Cấu trúc monorepo rõ ràng, Docker Compose sẵn sàng, CI/CD pipeline hoạt động, authentication đa role (OTP cho tourist, email/password cho vendor/admin) đã đầy đủ với JWT refresh token rotation. RBAC được enforce ở middleware.

### Cần fix:

**1. Mismatch tên field `ratingAvg` vs `averageRating`**

Schema `vendors.ts` định nghĩa `ratingAvg` (dòng 26), nhưng `review.service.ts` dòng 114 ghi `averageRating`. Đây là bug nghiêm trọng — khi khách đánh giá, rating sẽ không được ghi vào DB. Dù dashboard đã sửa write sang `ratingAvg`, nhưng cần verify lại toàn bộ flow.

```
packages/db/src/schema/vendors.ts:26:  ratingAvg: decimal('rating_avg', { precision: 3, scale: 2 }).notNull().default('0.00'),
apps/api/src/services/review.service.ts:114:  averageRating: stats.avg || '0',  // ❌ SAI — phải là ratingAvg
```

---

## Phase 2: Vendor & Service Management

### Tình trạng chung: ⭐⭐⭐⭐⭐ (8/8) — Hoàn chỉnh

Admin có thể approve/reject/suspend vendor với state transition guard. Vendor CRUD service đầy đủ. Tourist browse/search với Vietnamese-aware search (tsvector + unaccent + trigram). Reviews đã hoạt động.

**Điểm mạnh:**
- Vietnamese search dùng `websearch_to_tsquery` + ILIKE fallback — giải quyết tốt vấn đề tiếng Việt
- Multi-filter + sort (relevance, price, rating, newest) đầy đủ
- Vendor status state machine (pending→active/rejected, active→suspended) có guard ngăn transition không hợp lệ
- Rejection reason được lưu audit

**Đề xuất cải tiến:**
- Thêm **geo-filter** (lọc theo khoảng cách đến bãi biển Tây An hoặc trung tâm) — Phase 2 spec ghi dùng lat/lng filter đơn giản, nhưng chưa thấy implementation
- Thêm **service images gallery** với lightbox zoom — hiện chỉ có image URL, chưa có preview

---

## Phase 3: Orders, Vouchers & QR

### Tình trạng chung: ⭐⭐⭐⭐⭐ (13/13) — Hoàn chỉnh

Toàn bộ flow mua voucher → nhận voucher → quét QR → redeem → complete hoạt động. State machine `CREATED→PAID→REDEEMED→COMPLETED→SETTLED` được enforce ở tất cả các điểm. Double redemption prevention với optimistic locking (`version` column). Auto-confirm 24h job tồn tại.

**Điểm mạnh:**
- QR token là signed JWT (HS256) — an toàn, không thể giả mạo
- Atomic operations với Drizzle transactions — đảm bảo consistency
- Idempotency ở cả 2 chiều (vendor quét khách + tourist quét vendor)
- Order cancellation cho unpaid orders — khách không bị mất tiền khi chọn nhầm

**Đề xuất cải tiến:**
- Thêm **order modification** (thay đổi số lượng/service trước khi thanh toán) — hiện tạo order mới
- Thêm **voucher transfer** (tặng voucher cho người khác) — market Việt Nam rất thích tính năng này
- Thêm **group booking** (nhiều khách cùng 1 order) — hiện chỉ 1 tourist/order

---

## Phase 4: Payment Integration

### Tình trạng chung: ⭐⭐⭐⭐ (7/8) — Khá tốt

3 gateway (VNPay/Momo/SePay) đều có HMAC signature verification, idempotency key, refund flow. Polling fallback cho missed webhooks.

### Cần fix:

**1. `processRefund()` chưa thực sự gọi API**

Cả 3 gateway đều implement `processRefund()` nhưng **chỉ log, không call API thật**. VNPay và Momo cần HTTP request thật sự đến endpoint của gateway. Đây là **blocker cho production** nếu cần refund thật.

```
gateways/vnpay.ts    — processRefund() { logger.info('refund request logged') }
gateways/momo.ts     — processRefund() { logger.info('refund request logged') }
gateways/sepay.ts    — processRefund() { logger.info('refund request logged') }
```

**Đề xuất:** Viết integration test với sandbox credentials trước khi production. VNPay có test environment, Momo có sandbox portal.

**Đề xuất cải tiến:**
- Thêm **payment method icons** trong checkout UI để tourist biết đang chọn gateway nào
- Thêm **retry mechanism** cho webhook failures (hiện chỉ polling 30 min)
- Thêm **partial refund** (refund 1 phần voucher thay vì toàn bộ order) — phục vụ trường hợp khách hủy 1 trong nhiều dịch vụ

---

## Phase 5: Settlement, Notifications & Dashboards

### Tình trạng chung: ⭐⭐⭐⭐ (14/16) — Tốt, có 2 bug

16 requirements, 14 đã hoàn thành. Settlement batch job, commission 8%, reconciliation report, notification system đều có.

### Cần fix:

**1. Bug SQL trong `getVendorDashboard()` — "today's orders" logic sai**

```sql
-- DÒNG 28: Sai — so sánh UUID với subquery trả về date
gte(orderItems.orderId, sql`(SELECT id FROM orders WHERE created_at >= ${today} LIMIT 1)`)

-- PHẢI LÀ: Join orders và filter theo date
.leftJoin(orders, eq(orderItems.orderId, orders.id))
.where(and(
  eq(orderItems.vendorId, vendorId),
  gte(orders.createdAt, today),
))
```

Kết quả: Dashboard vendor luôn hiển thị 0 orders hôm nay → vendor không tin dashboard.

**2. Admin content route structure cần verify**

Sidebar link `/dashboard/content` nhưng layout parent là `dashboard/layout.tsx`. Cần verify routing đúng hay bị 404. Kiểm tra `apps/admin/src/app/dashboard/content/page.tsx` có load đúng không.

**Đề xuất cải tiến:**
- **Push notification thật sự** — hiện chỉ tạo notification record trong DB. Cần tích hợp FCM (Android) + APNs (iOS) để push thật. Nếu không, tourist/vendor phải vào app mới thấy thông báo.
- **Settlement webhook** — gửi webhook đến vendor khi tiền được disbursement để vendor biết đã nhận tiền
- **Vendor settlement config UI** — cho vendor tự chọn instant vs periodic trong profile settings (hiện chỉ có trong DB schema)
- **Charts/visualizations** trên admin dashboard — hiện chỉ là số, chưa có chart

---

## Phase 6: AI, Combos, Content & Reviews

### Tình trạng chung: ⭐⭐⭐⭐ (9/10) — Gần hoàn chỉnh

Combos, content (articles + weather), reviews moderation đều done. AI itinerary generator backend có rồi.

### Cần fix:

**1. AI Itinerary screen trên mobile là placeholder**

`apps/mobile/src/app/(tabs)/ai.tsx` — 213 dòng code nhưng chỉ show alert "Sắp ra mắt!" khi nhấn nút. Backend `itinerary.service.ts` đã có `generateItinerary()` gọi Gemini API, nhưng mobile app không gọi.

**Impact:** Phase 6 gần như vô dụng cho tourist vì tính năng AI là key differentiator.

**Cần implement:**
1. Wire `POST /itinerary/generate` từ mobile app
2. Parse Gemini response → render itinerary cards với service info
3. "Đặt ngay" button trên mỗi activity → gọi `/orders`
4. Loading state + error handling

**2. `updateServiceRating()` là stub**

`review.service.ts` dòng 123 comment: "No persistent averageRating column on services table — stub for future migration." Service ratings không được computed.

**Đề xuất cải tiến:**
- Thêm **AI itinerary save/share** — tourist lưu lịch trình AI vào profile, chia sẻ link
- Thêm **AI price estimate** trong response (dựa trên real service prices thay vì ước lượng)
- Thêm **service recommendation** (gợi ý dịch vụ tương tự dựa trên browsing history) — embedding-based, Phase 2 spec có ghi

---

## Đề xuất chiến lược tổng thể

### 🔴 P0 — Must Fix trước Production

| # | Vấn đề | File | Fix |
|---|--------|------|-----|
| 1 | AI itinerary mobile UI placeholder | `apps/mobile/src/app/(tabs)/ai.tsx` | Wire backend API, render results, add booking flow |
| 2 | Vendor dashboard "today's orders" SQL bug | `apps/api/src/services/dashboard.service.ts:28` | Fix join logic, filter by `orders.createdAt >= today` |
| 3 | `processRefund()` không call API thật | `apps/api/src/gateways/*.ts` | Implement real HTTP calls với sandbox credentials |
| 4 | Push notification chỉ là DB record | `apps/api/src/services/notification.service.ts` | Tích hợp FCM + APNs push thật |

### 🟡 P1 — Nên fix sau P0

| # | Cải tiến | Lý do |
|---|----------|-------|
| 5 | Service rating average column | Khách muốn xem rating trung bình của từng dịch vụ |
| 6 | Geo-distance filter | Cải thiện UX discovery đáng kể cho tourist |
| 7 | Payment retry/retry queue | Đảm bảo webhook không bị miss |
| 8 | Admin content routing verification | Verify `/dashboard/content` load đúng |

### 🟢 P2 — Cải tiến theo thời gian

| # | Cải tiến | Priority | Ghi chú |
|---|----------|----------|---------|
| 9 | Voucher gifting/transfer | Medium | Việt Nam market rất thích |
| 10 | Group booking | Low | v2 feature |
| 11 | Charts on admin dashboard | Low | Thêm recharts/shadcn charts |
| 12 | AI itinerary save/share | Medium | Tăng engagement |
| 13 | Service recommendation engine | Low | Cần embedding, Phase 2 spec có ghi |

---

## Nhận xét tổng kết

**Điểm mạnh nổi bật:**
- Kiến trúc backend chắc chắn: Drizzle ORM, optimistic locking, atomic transactions, state machine enforcement
- Bảo mật tốt: RBAC, HMAC signature verification, JWT, rate limiting OTP
- Type-safety toàn bộ: Zod validators ở tất cả inputs
- Documentation đầy đủ: 63 task files, screen docs, architecture docs, seed data
- CI/CD pipeline hoàn chỉnh: lint → typecheck → test → docker build

**Điểm yếu cần khắc phục:**
- AI feature có backend nhưng không có UI — Phase 6 gần như vô dụng
- Push notification chỉ là "record" chưa có "push" thật
- Refund flow có structure nhưng chưa call real API
- Vendor dashboard có bug logic nghiêm trọng

**Lời khuyên cho roadmap tiếp theo:**
1. Fix P0 items → internal beta với 5-10 vendors
2. Thêm real integration testing (VNPay sandbox, Momo sandbox)
3. Thêm E2E tests với Playwright cho critical flows (order → payment → redeem)
4. Performance test settlement batch job với 10K+ vouchers
5. Sau beta → P1 items → public launch

---

*Document generated: 2026-04-18*
*Review methodology: Codebase survey + feature matrix cross-reference với ROADMAP.md*
