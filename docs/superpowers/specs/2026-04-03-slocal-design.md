# S-Loco Design Specification

**Version:** 1.0
**Date:** 2026-04-03
**Status:** Draft → Ready for Review
**Type:** Consolidated Design Spec (Brownfield v1)

---

## 1. Overview

### 1.1 Problem

Vietnamese tourists visiting Sầm Sơn face a fragmented local services market: no single place to discover, book, and pay for restaurants, hotels, spas, electric carts, and entertainment. Walk-in pricing is opaque and often inflated for tourists. Vendors manage bookings via Zalo, Google Forms, and cash — creating operational chaos and reconciliation burden. No platform exists that combines discovery, transparent pricing, QR-based redemption, and automatic vendor settlement.

### 1.2 Solution

S-Loco is a super-app for local services at Sầm Sơn — a TypeScript end-to-end monorepo connecting tourists with vetted local vendors through pre-paid electronic vouchers. Tourists find services in one app, purchase vouchers, present QR codes at venues, and the platform handles automatic settlement with commission deduction. Vendor discount 8%, tourist saves 5%, platform keeps 3%.

### 1.3 Scope

**In scope:** Tourist app (mobile + PWA), Vendor app, Admin dashboard, API backend, 8 business logic services, payment gateway integrations (VNPay, Momo, SePay), AI itinerary generation.

**Out of scope:**

| Feature | Reason |
|---------|--------|
| Real-time chat | High complexity; vendors prefer phone/Zalo |
| Social features (follow/share) | Not core to voucher model |
| Dynamic pricing | Undermines price transparency value prop |
| Vendor self-registration | Quality control requires manual onboarding |
| App Store/Google Play release | v1 focuses on PWA + dev builds; native release in v2 |
| Multi-language (English) | Market is Vietnamese-only for now |
| Dark mode | Single light theme only |
| Meilisearch full-text search | PostgreSQL LIKE/tsvector sufficient for v1 |
| PostGIS geospatial search | Lat/lng filter sufficient for v1 |

---

## 2. Vision & Strategy

### 2.1 Vision Statement

> For **khách du lịch Việt Nam đến Sầm Sơn**, S-Loco is a **super-app for local services** that **connects them with vetted vendors through transparent-priced electronic vouchers** — eliminating the frustration of walk-in price haggling, scattered reviews, and cash-only payments that define the current beach resort experience.

Khách du lịch tìm, đặt, và thanh toán mọi dịch vụ địa phương (nhà hàng, khách sạn, spa, xe điện, giải trí) trong một ứng dụng duy nhất. Họ nhận voucher điện tử, quét QR tại cơ sở, và luôn biết mình được giá tốt — không phải giá "du khách".

### 2.2 User Personas

**Minh — Budget Family Traveler**
- Name: Minh Nguyễn, 35 tuổi, kỹ sư phần mềm, cha hai con (8 và 12 tuổi)
- Goals: Tìm giá tốt cho cả gia đình, không bị chặt chém, tiết kiệm thời gian lên kế hoạch
- Pain Points: Phải hỏi khắp nơi so sánh giá, thanh toán tiền mặt bất tiện
- Quote: *"Tôi muốn biết trước giá chính xác và yên tâm rằng con tôi sẽ có bữa ăn ngon mà không bị tính giá gấp 3."*
- Archetype: Value Seeker, Convenience Driven

**Lan's Restaurant — Local Vendor Owner**
- Name: Trần Thị Lan's, 42 tuổi, chủ quán Hải Sản 29 Bãi Đẹp, 12 năm kinh nghiệm, 8 nhân viên
- Goals: Tiếp cận khách du lịch trực tiếp qua app, giảm phụ thuộc OTA, nhận tiền nhanh
- Pain Points: Zalo/Google Form đặt chỗ lộn xộn, no-show không báo trước, đối soát cuối ngày mệt mỏi
- Quote: *"Tôi muốn khách đặt trước qua app, tôi thấy đơn ngay, khách đến quét QR là xong. Không phải cầm điện thoại lên xuống."*
- Archetype: Efficiency Operator, Revenue Focused

**Thu — Platform Admin / Operations**
- Name: Hoàng Thị Thu, 28 tuổi, Operations Lead, quản lý 25–30 vendor đầu tiên
- Goals: Đảm bảo chất lượng vendor, giải quyết dispute nhanh, theo dõi doanh thu nền tảng
- Pain Points: Onboarding vendor thủ công qua Google Sheets, không có real-time visibility, đối soát bằng tay
- Quote: *"Tôi cần một dashboard để thấy ai đang bán gì, ai chưa được duyệt, và tiền đang chảy ra sao — tất cả trong một chỗ."*
- Archetype: Operational Controller, Quality Guardian

### 2.3 Success Metrics

| # | KPI | Target (v1 Launch) | Rationale |
|---|-----|--------------------|-----------|
| 1 | MAU (Monthly Active Tourists) | 500 tourists/month | Validates product-market fit |
| 2 | Vendor Retention Rate | ≥ 85% after 60 days | Vendors stay if revenue > commission cost |
| 3 | Voucher Utilization Rate | ≥ 75% of paid vouchers redeemed | Low rate signals trust/processing friction issues |
| 4 | Average Order Value (AOV) | ≥ 250,000 VND/order | Generates enough commission to sustain ops |
| 5 | App Store / PWA Rating | ≥ 4.0 ⭐ | Proxy for UX quality and tourist satisfaction |

---

## 3. User Stories

### 3.1 MoSCoW Overview

| Priority | Count | Phase |
|----------|-------|-------|
| Must have | 22 | Phases 1–5 |
| Should have | 24 | Phases 2–6 |
| Could have | 17 | Phase 6+ |
| **Total** | **63** | |

### 3.2 By Phase

**Phase 1: Foundation & Auth** (11 requirements, 10 stories)
- Must: Tourist OTP signup/login, vendor/admin email+password login, JWT access+refresh (15min/30d), RBAC (tourist/vendor_owner/admin), PostgreSQL schema (Drizzle, 15+ tables), shared Zod validators
- Should: OTP rate limiting (5/min, exponential backoff), token persistence (Keychain/Keystore), Bun monorepo, Docker Compose dev env, CI pipeline

**Phase 2: Vendor & Service Management** (8 requirements, 8 stories)
- Must: Admin approve/reject/suspend vendors, admin manage users+roles, tourist browse by category (ẩm thực, lưu trú, spa, xe điện, giải trí, mua sắm), tourist view vendor profile, tourist view service detail
- Should: Vendor CRUD services, tourist search by keyword (Vietnamese-aware, unaccent), tourist filter by category/price/rating
- Could: Tourist read vendor reviews

**Phase 3: Orders, Vouchers & QR Redemption** (13 requirements, 13 stories)
- Must: Tourist add to cart + checkout, system creates vouchers per order item, voucher state machine (CREATED→PAID→REDEEMED→COMPLETED→SETTLED), tourist view voucher QR, QR token = signed JWT, vendor scan QR to redeem, atomic double-redemption prevention
- Should: Tourist view order history, tourist cancel unpaid orders, tourist scan vendor QR to self-redeem, vendor verify QR without redeeming, auto-confirm (24h timeout)
- Could: Tourist request refund (deferred to Phase 4 payment integration)

**Phase 4: Payment Integration** (8 requirements, 8 stories)
- Must: VNPay redirect, VNPay IPN webhook with signature verification, idempotency keys, refund processing
- Should: Momo integration (HMAC-SHA256), SePay QR webhook, polling fallback for missed webhooks

**Phase 5: Settlement, Notifications & Dashboards** (16 requirements, 15 stories)
- Must: Commission formula enforced (8/5/3 split), vendor settlement choice (instant/3-day periodic), vendor settlement history, push notification on PAID (tourist), push notification on new order (vendor), push notification on status change (both)
- Should: Settlement batch job, admin approve/reject batches, reconciliation report (vouchers = settlements + commission), in-app notification list + mark-as-read, vendor dashboard (daily orders/revenue), admin view all orders, admin manage settlements, admin revenue dashboard

**Phase 6: AI, Combos, Content & Reviews** (13 requirements, 13 stories)
- Should: AI itinerary (days, budget, preferences, group type), AI maps to real services, book from itinerary, vendor create combos, tourist purchase combos (generates individual vouchers), news/events articles, weather forecast, tourist rate/review after COMPLETED, reviews update avg ratings
- Could: Admin manage content (CMS)

Full stories: see `.haki/PRd.md`

---

## 4. Architecture

### 4.1 System Overview

S-Loco is a **TypeScript end-to-end monorepo** on **Bun runtime** with modular monolith architecture: business logic isolated in service packages, routed through a single Hono API Gateway. All services share the same PostgreSQL database and Redis instance. Services communicate internally (no inter-process networking). External integrations accessed via service packages.

### 4.2 Service Boundaries

| Service | Responsibility | Key Dependencies |
|---|---|---|
| **Auth Service** | Register, login (OTP/password), JWT issuance, refresh rotation, RBAC | Redis (OTP/session store), DB (users) |
| **Booking & Voucher Service** | Order creation, voucher lifecycle (state machine), combo, QR generation | DB, Redis (cache), Payment Service |
| **Vendor Service** | CRUD vendor, services, categories, media, onboarding, ratings/reviews | DB, Object Storage |
| **Payment Service** | Transaction creation, webhook processing, refunds, retry logic | VNPay/Momo/SePay, DB |
| **Settlement Service** | Reconciliation, commission calculation, disbursement (immediate/periodic) | DB, Redis (BullMQ job queue) |
| **Content Service** | News CRUD, events, weather cache | DB, External weather API |
| **AI Itinerary Service** | Receive preferences, fetch matching services, call AI, return optimized itinerary | AI APIs (OpenAI/Gemini), Vendor Service |
| **Notification Service** | Push via FCM, SMS, in-app notifications | FCM, SMS provider, Redis (BullMQ) |

### 4.3 Data Flows

**Voucher Purchase & Redemption:**
```
Tourist selects service → POST /orders → Order + Voucher created (status: CREATED)
  → Redirect to payment gateway (VNPay / Momo / SePay)
  → Gateway sends webhook → Payment Service → Voucher updated to PAID
  → Notification pushed to tourist ("Voucher ready") and vendor ("New order")
  → Tourist opens voucher → displays QR code
  → Vendor scans QR → POST /qr/redeem → Voucher: REDEEMED
  → Vendor marks complete → Voucher: COMPLETED
  → Settlement Service triggered → commission calculated → disbursement → Voucher: SETTLED
```

**Vendor Settlement:**
- Immediate: Settlement job queued immediately on `COMPLETED`.
- Periodic: Batched (default 3-day cycle).
- Formula: `vendor_amount = customer_paid − (0.08 × customer_paid)`
- Retry: 1 hour intervals, max 3 attempts; final status: `SETTLED` or `FAILED`.

**AI Itinerary Generation:**
```
Tourist submits preferences (budget, dates, interests)
  → AI Service fetches matching services from Vendor Service
  → AI Service calls OpenAI/Gemini with structured prompt
  → LLM returns optimized schedule (structured JSON)
  → Response mapped to platform services with voucher suggestions
  → Tourist can "Book All" or select individual services
```

### 4.4 Voucher State Machine

```
[*] ──CREATED──▶ PAID ──REDEEMED──▶ COMPLETED ──SETTLED──▶ [settled]
  │           │
  │           ├──EXPIRED──▶ REFUNDED
  │           └──REFUNDED
  └──CANCELLED
```

| Transition | Trigger |
|---|---|
| `CREATED → PAID` | Payment gateway webhook confirms success |
| `CREATED → CANCELLED` | Tourist cancels order, or payment timeout |
| `PAID → REDEEMED` | Vendor scans tourist's QR, or tourist scans vendor QR |
| `PAID → EXPIRED` | Past validity date |
| `PAID → REFUNDED` | Tourist requests refund (via admin) |
| `REDEEMED → COMPLETED` | Vendor confirms service delivery |
| `COMPLETED → SETTLED` | Settlement disbursement confirmed |
| `EXPIRED → REFUNDED` | Auto refund on expiry |

**Constraint:** Only valid transitions are allowed — enforced application-level.
**Idempotency:** Redeem is idempotent — re-scanning the same QR returns the same result without double-state change.
**QR token format:** Signed JWT containing `voucher_id + expiry`. Verified server-side on scan. Not a database lookup token.

### 4.5 Settlement Formula

```
commission_amount = customer_paid × 0.08   (8%)
vendor_amount     = customer_paid − commission_amount
```

**Example (customer pays 100,000 VND):**

| Role | Amount |
|---|---|
| Customer paid | 100,000 VND |
| Commission (S-Loco) | 8,000 VND |
| Vendor receives | 92,000 VND |

### 4.6 Tech Stack

| Layer | Technology |
|---|---|
| Mobile (tourist) | React Native + Expo SDK 52+, Expo Router, Zustand, TanStack Query |
| Mobile (vendor) | React Native + Expo, expo-camera (QR scanning) |
| Admin | Next.js 15 (App Router), shadcn/ui, Tailwind CSS v4, TanStack Table, Recharts |
| API Runtime | Bun 1.x, Hono 4, Zod |
| ORM | Drizzle ORM 0.36+ |
| Database | PostgreSQL 16 (JSONB, unaccent, PostGIS) |
| Cache / Queue | Redis 7 (Valkey), BullMQ |
| Object Storage | Cloudflare R2 (S3-compatible) |
| Auth | Custom JWT via `jose`, OTP via Redis |
| AI | OpenAI GPT-4o-mini / Gemini 2.0 Flash, Vercel AI SDK |
| Monitoring | Pino (structured logging), Sentry, Better Stack (Logtail) |
| CI/CD | GitHub Actions |
| Containerization | Docker + Docker Compose |
| Monorepo | Bun workspaces + Turborepo |

---

## 5. API Design

### 5.1 Conventions

**Base URLs:**
```
Production:  https://api.S-Loco.vn/v1
Staging:     https://api-staging.S-Loco.vn/v1
Development: http://localhost:3000/v1
```

**Authentication:**
- Access token (JWT): 15 min TTL, stored in memory/secure storage
- Refresh token (JWT): 30 day TTL, `httpOnly` cookie (web) / Keychain (mobile), one-time rotation
- Header: `Authorization: Bearer <access_token>`

**Request headers:**
```
Content-Type: application/json
Accept: application/json
X-Request-ID: <uuid>        # Correlation ID
Accept-Language: vi         # vi | en
```

**Success response:**
```json
{ "success": true, "data": { ... }, "meta": { "request_id": "..." } }
```

**Paginated response:**
```json
{ "success": true, "data": [ ... ], "pagination": { "page": 1, "per_page": 20, "total": 150, "total_pages": 8, "has_next": true, "has_prev": false }, "meta": { "request_id": "..." } }
```

**Error response:**
```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "...", "details": [...] }, "meta": { "request_id": "..." } }
```

**Pagination:** Cursor-based (`?cursor=&limit=`) for feeds; offset-based (`?page=&per_page=`) for admin listings.

### 5.2 Endpoint Catalog

| Group | Path | Key Endpoints |
|---|---|---|
| Auth | `/v1/auth` | `POST /otp/send`, `POST /otp/verify`, `POST /login`, `POST /refresh`, `POST /logout`, `GET /me` |
| Vendors | `/v1/vendors` | `GET /` (public), `GET /:id` (public), `POST /` (admin), `PATCH /:id/status` (admin) |
| Services | `/v1/services`, `/v1/categories` | `GET /` (public), `POST /` (vendor), `PATCH /:id` (vendor/admin) |
| Combos | `/v1/combos` | `GET /` (public), `POST /` (vendor) |
| Orders | `/v1/orders` | `POST /` (tourist), `GET /` (role-filtered), `GET /:id`, `POST /:id/cancel` (tourist) |
| Vouchers | `/v1/vouchers` | `GET /` (role-filtered), `GET /:id`, `POST /:id/complete` (vendor) |
| QR | `/v1/qr` | `POST /redeem` (vendor), `GET /verify/:token` (vendor) |
| Payments | `/v1/payments` | `POST /webhook/vnpay`, `POST /webhook/momo`, `POST /webhook/sepay`, `POST /:id/refund` (admin) |
| Settlements | `/v1/settlements` | `GET /` (vendor/admin), `POST /:id/approve` (admin), `GET /summary` (vendor) |
| Content | `/v1/content` | `GET /news`, `GET /events`, `GET /weather` (public); `POST/PATCH /news` (admin) |
| AI | `/v1/ai` | `POST /itinerary` (tourist), `GET /itinerary/:id` (tourist) |
| Reviews | `/v1/reviews` | `POST /` (tourist, post-COMPLETED), `PATCH /:id`, `DELETE /:id` |
| Notifications | `/v1/notifications` | `GET /` (cursor-based), `PATCH /:id/read`, `POST /read-all`, `GET /unread-count` |
| Admin | `/v1/admin` | `GET /dashboard`, `GET /users`, `PATCH /users/:id/role`, `GET /vendors/pending`, `GET /orders`, `GET /revenue` |

Full schemas with request/response examples: see `docs/api-contract.md`

### 5.3 Webhook Conventions

| Gateway | Method | Auth | Idempotency Key | Signature |
|---|---|---|---|---|
| **VNPay IPN** | `POST /v1/payments/webhook/vnpay` | IP whitelist + `vnp_SecureHash` | `vnp_TxnRef` + `vnp_TransactionStatus` | HMAC verification |
| **Momo** | `POST /v1/payments/webhook/momo` | HMAC-SHA256 | `orderId` + `transId` | `signature` header/body |
| **SePay** | `POST /v1/payments/webhook/sepay` | Signature verification | `id` from payload | Provider secret |

Response: Return `200 OK` for accepted; non-00/`resultCode` rejection for VNPay/Momo.

### 5.4 Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Input không hợp lệ |
| `UNAUTHORIZED` | 401 | Chưa đăng nhập hoặc token hết hạn |
| `FORBIDDEN` | 403 | Không có quyền truy cập |
| `NOT_FOUND` | 404 | Resource không tồn tại |
| `CONFLICT` | 409 | Xung đột dữ liệu (duplicate) |
| `RATE_LIMITED` | 429 | Quá giới hạn request |
| `OTP_EXPIRED` | 400 | OTP đã hết hạn |
| `OTP_INVALID` | 400 | OTP sai |
| `OTP_TOO_MANY_ATTEMPTS` | 429 | Quá nhiều lần thử OTP |
| `VOUCHER_ALREADY_REDEEMED` | 400 | Voucher đã sử dụng |
| `VOUCHER_EXPIRED` | 400 | Voucher đã hết hạn |
| `VOUCHER_INVALID_STATUS` | 400 | Voucher không ở trạng thái hợp lệ |
| `ORDER_CANNOT_CANCEL` | 400 | Đơn không thể hủy (đã thanh toán) |
| `PAYMENT_FAILED` | 400 | Thanh toán thất bại |
| `PAYMENT_SIGNATURE_INVALID` | 400 | Webhook signature không hợp lệ |
| `VENDOR_NOT_ACTIVE` | 400 | Vendor chưa được duyệt |
| `SERVICE_UNAVAILABLE` | 400 | Dịch vụ tạm ngưng |
| `INSUFFICIENT_STOCK` | 400 | Hết slot / tồn kho |
| `AI_GENERATION_FAILED` | 500 | Lỗi tạo lịch trình AI |
| `INTERNAL_ERROR` | 500 | Lỗi hệ thống |

Full list: see `docs/api-contract.md`

### 5.5 Rate Limits

| Endpoint Group | Limit | Window |
|---|---|---|
| Auth (OTP) | 5 requests | 1 min / phone |
| Auth (login) | 10 requests | 1 min / IP |
| AI Itinerary | 5 requests | 1 hour / user |
| General API | 100 requests | 1 min / user |
| Webhook (incoming) | 1000 requests | 1 min / IP |

---

## 6. Data Model

### 6.1 Core Entities

Full Drizzle schema: see `docs/architecture/database-design.md`

| Entity | Key Fields |
|---|---|
| **users** | id, phone, email, password_hash, role (tourist/vendor_owner/admin), status |
| **vendors** | id, user_id, name, slug, category_id, address, lat_lng, phone, logo_url, cover_url, status (pending/active/suspended), rating_avg, rating_count |
| **categories** | id, name, icon, sort_order |
| **services** | id, vendor_id, name, description, original_price, promo_price, images[], options[], status, rating_avg, rating_count |
| **combos** | id, vendor_id, name, description, price, service_ids[], status |
| **orders** | id, order_number, user_id, vendor_id, total_amount, status, payment_gateway, note |
| **order_items** | id, order_id, service_id/combo_id, quantity, unit_price, options |
| **vouchers** | id, voucher_code, order_id, order_item_id, service_id, status, qr_token (JWT), redeemed_at, completed_at, settled_at, expiry_date |
| **payments** | id, order_id, gateway, gateway_txn_id, amount, status, idempotency_key, refund_id |
| **settlements** | id, batch_id, vendor_id, voucher_ids[], gross_amount, commission, vendor_net, status (pending/approved/rejected/disbursed/failed) |
| **reviews** | id, voucher_id, user_id, vendor_id/service_id, rating (1–5), text, is_hidden, created_at |
| **notifications** | id, user_id, type, title, body, data (JSON), is_read, created_at |
| **articles** | id, slug, title, content (rich text), cover_url, category, status, published_at |
| **events** | id, name, date, venue, description, vendor_ids[], status |
| **ai_itineraries** | id, user_id, input (JSON), plan (JSON), status, created_at |

### 6.2 Key Relationships

```
users (1) ──< vendors          (one user can own multiple vendors)
vendors (1) ──< services       (one vendor has many services)
vendors (1) ──< combos         (one vendor has many combos)
vendors (1) ──< reviews        (vendors receive reviews)
vendors (1) ──< settlements    (vendors receive settlements)
categories (1) ──< vendors     (one category per vendor)
orders (1) ──< order_items     (one order has many items)
orders (1) ──< payments        (one order has one payment)
orders (1) ──< vouchers        (one order generates many vouchers)
order_items (1) ──< vouchers  (each item generates one voucher)
vouchers (1) ──< reviews       (vouchers can have one review)
combos (M) ──< services        (combos bundle multiple services)
```

---

## 7. UI/UX Design

### 7.1 Design System: The Coastal Editorial

**Creative North Star:** *"The Fluid Concierge"* — premium, breezy coastal lifestyle. Elements float like water, not locked in rigid grids. Tonal depth and editorial imagery.

**Color Palette (key tokens):**

| Token | Hex | Role |
|---|---|---|
| `primary` | `#005E97` | Primary actions, navigation highlights |
| `primary_container` | `#0077B6` | CTA gradient end, badges |
| `primary_fixed` | `#90E0EF` | Icon backgrounds |
| `secondary` | `#3A5A8C` | Secondary buttons, links |
| `tertiary` | `#3F3D99` | Discount badges, alerts |
| `surface` | `#F4F7FB` | Page background |
| `surface_container_lowest` | `#FFFFFF` | Cards |
| `on_surface` | `#161B2E` | Primary text (never pure `#000`) |
| `on_surface_variant` | `#3B4460` | Secondary text (body-md+) |
| `outline` | `#6B7694` | Placeholder, disabled |
| `error` | `#BA1A1A` | Error states |
| `admin-sidebar-bg` | `#161B2E` | Admin sidebar (dark) |
| `vendor-success` | `#2E7D32` | Order confirmed, payout received |
| `vendor-warning` | `#E65100` | New order pending |

**Signature gradient:** `linear-gradient(135deg, #005E97, #0077B6)`

**Typography:**
| Role | Font | Weight |
|---|---|---|
| Headlines & Display | Plus Jakarta Sans | 600–700 |
| Body, Titles, Labels | Be Vietnam Pro | 400–600 |

**Spacing scale:** `spacing.1` (4px) → `spacing.12` (48px)
**Elevation:** Tonal layering only (no shadows); ambient shadow `0 8px 32px rgba(22,27,46,0.06)` for floating elements only
**No-Line Rule:** No 1px borders; use background color shifts for boundaries
**Glassmorphism:** `bg rgba(244,247,251,0.7)` + `backdrop-filter: blur(20px)` for tab bars and floating headers
**Roundness:** Full radius — `3rem` buttons, `16px+` cards

Full tokens: see `DESIGN.md` Sections 1–6

### 7.2 App-Specific Designs

| App | Design Document | Key Details |
|---|---|---|
| Tourist Mobile | `docs/design-mobile.md` | 15 screens, bottom tab nav (4 tabs), QR display (200×200px, auto-brightness), OTP 6-digit, VND `Intl.NumberFormat('vi-VN')`, 44×44px touch targets |
| Vendor App | `docs/design-vendor.md` | 11 screens, bottom tab nav (5 tabs), QR scanner (camera + viewfinder overlay + bottom sheet result), 48×48px action targets, revenue 7-day line chart |
| Admin Dashboard | `docs/design-admin.md` | 6 pages, dark sidebar (256px), Next.js + shadcn/ui + Tailwind v4, data tables with server-side pagination (20 rows/page), Recharts |
| PWA | `docs/design-pwa.md` | 15 screens, responsive (mobile/tablet/desktop ≥1024px), desktop: top header bar replaces bottom tabs, install prompt, service worker caching, `max-width: 480px` centered |

### 7.3 Shared Components

| Component | App | Notes |
|---|---|---|
| `StatusBadge` | All | 4+ color variants: PAID, REDEEMED, COMPLETED, CANCELLED, PENDING, APPROVED, DISBURSED |
| `VNDPrice` | All | Utility: `Intl.NumberFormat('vi-VN').format(amount) + '₫'` — never `toLocaleString()` without locale |
| `BottomSheet` | Mobile | Gesture-driven drag-to-dismiss |
| `Modal` | Admin/Web | shadcn Dialog, multiple sizes (sm→xl) |
| `Toast` | All | Auto-dismiss: 2.5s (mobile), 4s (admin web); left-border variants |
| `Skeleton` | All | Shimmer animation; CSS animation on web, RN Animated on mobile |
| `ServiceCard` | Tourist | Horizontal: 100×100 image + info |
| `VendorCard` | Tourist | Vertical for horizontal scroll |
| `VoucherCard` | Tourist | Horizontal: info left, QR thumbnail right |
| `OrderCard` | Vendor | Left-border status color, swipe actions |
| `StatCard` | Vendor/Admin | Icon + value + label + trend |
| `DataTable` | Admin | Server-side pagination, sort, filters, row actions |
| `QRScanner` | Vendor | Camera + animated viewfinder + result sheet |
| `RevenueChart` | Vendor/Admin | 7-day line chart (RN) / AreaChart (Admin) |
| `EmptyState` | All | Icon + title + description + CTA |

### 7.4 Accessibility

| Target | Standard |
|---|---|
| Tourist Mobile | WCAG 2.1 AA — 44×44px min touch targets, ARIA labels on icon buttons, outdoor contrast ≥ 4.5:1 |
| Vendor App | WCAG 2.1 AA — 48×48px primary actions, ARIA live region for scanner status |
| Admin Dashboard | WCAG 2.1 AA — focus trap in modals, `aria-sort` on table headers, skip-to-content link, `focus-visible` indicators |
| PWA | WCAG 2.1 AA + keyboard navigation, `prefers-reduced-motion`, browser zoom up to 200% |

---

## 8. Non-Functional Requirements

### 8.1 Performance
- API p95 latency: < 200ms for simple reads; < 2s for AI itinerary generation
- Database: PostgreSQL 16 with JSONB, `unaccent` extension, PostGIS for geo queries
- Cache: Redis 7 for hot data, BullMQ for background jobs
- CDN: Cloudflare R2 for static assets and media

### 8.2 Security
- JWT access tokens (15 min TTL), refresh token rotation (30 days, one-time use)
- RBAC enforced at API Gateway for all protected routes
- OTP rate limited: 5 req/min/phone with exponential backoff
- Webhook signature verification: VNPay (`vnp_SecureHash` HMAC), Momo (HMAC-SHA256), SePay (secret)
- Input validation: Zod schemas shared between frontend and backend
- Secure token storage: Keychain (mobile), `httpOnly` cookies (web)

### 8.3 Scalability
- Stateless API servers behind load balancer
- Database read replicas for Phase 2+
- Horizontal scaling of worker processes for BullMQ jobs

### 8.4 Observability
- Structured JSON logs via Pino with `X-Request-ID` correlation across services
- Sentry error tracking
- Better Stack (Logtail) for log aggregation
- Health check endpoint: `GET /health`

---

## 9. Implementation Roadmap

### 9.1 Phase Overview

| Phase | Name | Requirements | Key Deliverables |
|---|---|---|---|
| 1 | Foundation & Auth | FNDN-01..05, AUTH-01..06 (11) | Monorepo, DB schema, auth for all 3 roles |
| 2 | Vendor & Service Management | DISC-01..06, VNDR-01, ADMN-01, ADMN-06 (8) | Vendor onboarding, service catalog, tourist discovery |
| 3 | Orders, Vouchers & QR | ORDR-01..07, QRSN-01..04, VNDR-03..04 (13) | Purchase → redemption flow (mock payment) |
| 4 | Payment Integration | PAYM-01..07, ORDR-08 (8) | VNPay/Momo/SePay, refunds |
| 5 | Settlement, Notifications & Dashboards | STTL-01..06, NTFY-01..04, VNDR-02, VNDR-05, ADMN-02..04 (16) | Vendor payouts, push notifications, admin analytics |
| 6 | AI, Combos, Content & Reviews | AIIT-01..03, CMBO-01..03, CNTN-01..03, REVW-01..03, ADMN-05 (13) | AI itinerary, combos, content hub, reviews |

### 9.2 Phase 1: Foundation & Auth

**Goal:** Monorepo scaffolded, database schema deployed, authentication working for all three roles.

**Requirements:** FNDN-01, FNDN-02, FNDN-03, FNDN-04, FNDN-05, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06

**Key tasks:**
1. Initialize Bun workspaces + Turborepo (`packages/validators` first)
2. Drizzle schema: all 15+ tables, indexes, constraints
3. Docker Compose: PostgreSQL 16, Redis 7, MinIO
4. GitHub Actions CI: Biome lint + `tsc --noEmit` + Vitest
5. Tourist OTP flow (Redis OTP store, 6-digit, 5min TTL)
6. Admin/vendor email+password flow (bcrypt, JWT)
7. JWT access token (15min) + refresh token (30d, rotation)
8. RBAC middleware (tourist/vendor_owner/admin)
9. OTP rate limiting + exponential backoff

**Success criteria:** `bun install` succeeds; `docker compose up` starts all services; tourist can OTP → JWT; admin/vendor can login; protected endpoints reject unauthenticated requests.

### 9.3 Phase 2: Vendor & Service Management

**Goal:** Admin approves vendors, vendors manage services, tourists browse and discover.

**Requirements:** DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06, VNDR-01, ADMN-01, ADMN-06

**Key tasks:**
1. Admin: vendor approval workflow (pending→active→suspended)
2. Admin: user management + role changes
3. Vendor: CRUD services with images, prices, options
4. Vendor: service visibility toggle
5. Tourist: category browsing (ẩm thực, lưu trú, spa, xe điện, giải trí, mua sắm)
6. Tourist: vendor profile with services, address, hours, rating
7. Tourist: service detail with photos, price, options
8. Tourist: keyword search (PostgreSQL `unaccent` + `tsvector`)
9. Tourist: filter by category, price range, rating

### 9.4 Phase 3: Orders, Vouchers & QR

**Goal:** Complete purchase-to-redemption flow with mock payment.

**Requirements:** ORDR-01, ORDR-02, ORDR-03, ORDR-04, ORDR-05, ORDR-06, ORDR-07, QRSN-01, QRSN-02, QRSN-03, QRSN-04, VNDR-03, VNDR-04

**Key tasks:**
1. Cart + checkout flow (mock payment gateway redirect)
2. Order creation → voucher generation (one per item/quantity)
3. Voucher state machine with all transition guards
4. QR token generation: signed JWT (`voucher_id + expiry`)
5. Tourist voucher detail screen with QR display (200×200px)
6. Vendor QR scanner with camera + viewfinder overlay
7. Vendor scan → redeem (atomic `UPDATE ... WHERE status='PAID'`)
8. Tourist self-redeem via vendor fixed QR
9. QR validity preview without redeem
10. Vendor confirm completion (REDEEMED → COMPLETED)
11. Auto-confirm cron job (24h timeout)
12. Tourist order history and cancellation

### 9.5 Phase 4: Payment Integration

**Goal:** Real money flows through VNPay, Momo, and SePay.

**Requirements:** PAYM-01, PAYM-02, PAYM-03, PAYM-04, PAYM-05, PAYM-06, PAYM-07, ORDR-08

**Key tasks:**
1. VNPay redirect integration (card + bank QR)
2. VNPay IPN webhook with `vnp_SecureHash` verification → CREATED→PAID
3. Momo integration (HMAC-SHA256 webhook verification)
4. SePay webhook integration (amount + reference matching)
5. Idempotency key storage (DB) for all webhook handlers
6. Polling fallback job (check CREATED vouchers against gateway API)
7. Admin refund initiation → gateway API → voucher REFUNDED

### 9.6 Phase 5: Settlement, Notifications & Dashboards

**Goal:** Vendors get paid correctly; notifications delivered; admin has full visibility.

**Requirements:** STTL-01, STTL-02, STTL-03, STTL-04, STTL-05, STTL-06, NTFY-01, NTFY-02, NTFY-03, NTFY-04, VNDR-02, VNDR-05, ADMN-02, ADMN-03, ADMN-04

**Key tasks:**
1. Commission formula: `vendor_net = customer_paid × 0.92` on COMPLETED
2. Vendor settlement preference: instant vs. periodic (3-day)
3. Settlement batch job (BullMQ: hourly for instant, every 3 days for periodic)
4. Admin approve/reject settlement batches
5. Reconciliation report: `sum(vouchers) = sum(settlements) + sum(commission)`
6. FCM push notifications: PAID (tourist), new order (vendor), status change (both)
7. In-app notification list (cursor-based pagination) + mark-as-read
8. Vendor dashboard: today's orders, today's revenue, 7-day chart
9. Admin: all orders with filters + CSV export
10. Admin: revenue dashboard (GMV, commission, active vendors)

### 9.7 Phase 6: AI, Combos, Content & Reviews

**Goal:** Differentiating features — AI itinerary, service combos, content hub, reviews.

**Requirements:** AIIT-01, AIIT-02, AIIT-03, CMBO-01, CMBO-02, CMBO-03, CNTN-01, CNTN-02, CNTN-03, REVW-01, REVW-02, REVW-03, ADMN-05

**Key tasks:**
1. AI itinerary form (days, budget, preferences, group type)
2. AI service: fetch matching services → call LLM → structured day-by-day plan
3. "Book this" → cart pre-fill from AI suggestions
4. Vendor combo creation (2+ services, discounted price)
5. Combo purchase → N individual vouchers linked via `parent_id`
6. News CRUD + article reader with rich text
7. Weather API integration (cached 30 min)
8. Events listing
9. Tourist post-COMPLETED review (star rating + text)
10. Review aggregation → update `vendors.rating_avg`, `services.rating_avg`
11. Admin review moderation (hide/delete)
12. Admin CMS for news and events

---

## 10. Acceptance Criteria

| Phase | Acceptance Criteria |
|---|---|
| **Phase 1** | `bun install` succeeds; `docker compose up` starts PostgreSQL+Redis; Drizzle creates all tables; tourist OTP arrives <30s; admin/vendor login works; JWT tokens work; RBAC enforced; refresh rotation functional; OTP rate limiting returns 429 on 6th attempt |
| **Phase 2** | Admin creates/approves/rejects/suspends vendor; vendor CRUDs services with images; tourist browses 6 categories; tourist searches Vietnamese keywords; tourist filters by price/rating; service categories seeded |
| **Phase 3** | Tourist creates order → N vouchers generated; QR token is verifiable JWT; vendor scans QR → REDEEMED; tourist self-redeems via vendor QR; double-redemption returns 409; vendor confirms → COMPLETED; auto-confirm fires at 24h |
| **Phase 4** | VNPay redirect + IPN activates voucher; Momo webhook activates voucher; SePay webhook activates voucher; idempotency prevents double-processing; polling fallback activates vouchers; admin refunds PAID voucher → REFUNDED |
| **Phase 5** | Commission calculated correctly on COMPLETED (8%); vendor sees instant/periodic payout option; batch job creates settlement records; admin approves batch → DISBURSED; reconciliation balances; push notifications delivered within 10s; vendor sees daily dashboard |
| **Phase 6** | AI generates day-by-day plan mapped to real services; "Book this" pre-fills cart; combo generates individual vouchers; news/events display correctly; weather cached and displayed; reviews update ratings; admin moderates reviews |

---

## 11. Open Questions

| # | Question | Status | Resolution Owner |
|---|---|---|---|
| 1 | How does SePay match payments to internal orders — by exact amount + reference text in transfer memo? | Open | Architect |
| 2 | What is the VNPay IPN retry policy and timeout window before we consider payment failed? | Open | Architect |
| 3 | Should `services.options` be JSONB or a separate `service_options` table? | Open — Drizzle schema decision | Architect |
| 4 | Meilisearch upgrade path — when does v1 PostgreSQL search become insufficient? | Open — monitor after Phase 2 launch | Product |
| 5 | FCM vs. in-house push — is Firebase setup required at launch or deferred? | Open | Architect |
| 6 | `packages/ui` — shared UI components across all 4 apps — what's the component priority order? | Open | Architect |
| 7 | Illustration/empty state art — are custom illustrations needed or icon-based sufficient for v1? | Open — icon-based confirmed sufficient | Design |
| 8 | Dark mode — any plans for v2? | Open | Design |

---

## 12. References

- `.haki/REQUIREMENTS.md` — 63 requirements, traceability matrix, phase mapping
- `.haki/PRd.md` — Full user stories with MoSCoW priorities
- `.haki/ROADMAP.md` — 6-phase implementation roadmap
- `.haki/vision.md` — Vision statement, personas, KPIs, strategic position
- `.haki/discovery.md` — Brownfield project status, artifact inventory
- `.haki/reports/03-product-architect.md` — Architecture decisions
- `.haki/reports/04-ui-ux-designer.md` — Design decisions and gap analysis
- `docs/ARCHITECTURE.md` — Full system architecture (source of truth)
- `docs/api-contract.md` — Full API contracts, error codes, webhook conventions
- `docs/openapi.yaml` — Machine-readable OpenAPI 3.1 spec
- `docs/architecture/database-design.md` — Drizzle schema, 15+ tables, ERD
- `docs/architecture/api-design.md` — REST conventions, pagination, rate limits
- `docs/architecture/system-architecture.md` — C4 diagrams, data flows
- `docs/architecture/tech-stack.md` — Tech choices
- `DESIGN.md` — Design system tokens (source of truth), "The Coastal Editorial"
- `docs/design-mobile.md` — Tourist app: mobile tokens, 15 screens, navigation, accessibility
- `docs/design-vendor.md` — Vendor app: QR scanner spec, 11 screens, earnings, settlement
- `docs/design-admin.md` — Admin dashboard: dark sidebar, shadcn/ui, data tables, charts
- `docs/design-pwa.md` — PWA: responsive breakpoints, install prompt, service worker
- `.haki/codebase/CONVENTIONS.md` — Code style, naming, testing patterns (all implementers must read)
- `.haki/codebase/STRUCTURE.md` — Directory tree, entry points
