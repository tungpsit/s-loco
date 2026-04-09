# S-Loco Architecture

Consolidated from `docs/architecture/`. Source of truth: system-architecture.md, database-design.md, api-design.md, tech-stack.md.

---

## 1. System Overview

S-Loco is a **TypeScript end-to-end monorepo** travel super-app targeting Sầm Sơn, Vietnam. Built on **Bun runtime** for consistency across mobile, vendor, admin, and API layers.

### 1.1 Monorepo Structure

```
S-Loco/
├── apps/
│   ├── mobile/          # React Native / Expo (tourists)
│   ├── vendor/          # React Native / Expo (vendor app)
│   ├── admin/           # Next.js 15 (admin dashboard)
│   └── api/             # Hono API server
├── packages/
│   ├── shared/          # Shared types, utils, constants
│   ├── db/              # Drizzle ORM schema & migrations
│   ├── validators/      # Zod request/response schemas
│   └── ui/              # Shared UI components
├── services/            # Business logic services
│   ├── auth/
│   ├── booking/
│   ├── vendor/
│   ├── payment/
│   ├── settlement/
│   ├── content/
│   ├── ai/
│   └── notification/
├── docs/
└── docker-compose.yml
```

---

## 2. Architecture Pattern

**Pattern:** Modular monolith / service-oriented — business logic isolated in service packages, routed through a single API Gateway (Hono).

### 2.1 Core Service Boundaries

| Service | Responsibility | Key Dependencies |
|---|---|---|
| **Auth Service** | Register, login (OTP/password), JWT, refresh rotation, RBAC | Redis (OTP/session), DB |
| **Booking & Voucher Service** | Order creation, voucher lifecycle (state machine), combo, QR code | DB, Redis, Payment Service |
| **Vendor Service** | CRUD vendor, services, categories, media, onboarding, ratings | DB, Object Storage |
| **Payment Service** | Transaction creation, webhook processing, refunds, retry logic | Payment Gateways, DB |
| **Settlement Service** | Reconciliation, commission calculation, disbursement (immediate / periodic) | DB, Redis (BullMQ) |
| **Content Service** | News, events, weather cache | DB, External weather API |
| **AI Itinerary Service** | Receive preferences, call AI, return optimized itinerary | AI APIs, Vendor Service |
| **Notification Service** | Push (FCM), SMS, in-app notifications | FCM, SMS provider, Redis (BullMQ) |

### 2.2 Cross-cutting Concerns

| Concern | Approach |
|---|---|
| **Logging** | Pino (structured JSON), correlation ID per request |
| **Error Handling** | Centralized error handler, typed error codes, localized messages (vi/en) |
| **Caching** | Redis — session, OTP, voucher state, service listings (TTL-based) |
| **Idempotency** | Idempotency key on payment/settlement requests |
| **Rate Limiting** | Token bucket at API Gateway (Redis-backed) |
| **Health Checks** | `/health` per service |
| **Correlation/Tracing** | `X-Request-ID` propagated across all services |

---

## 3. External Integrations

| System | Protocol | Purpose |
|---|---|---|
| **VNPay** | HTTPS (redirect + IPN callback) | Card + bank QR payments. IPN must verify `vnp_SecureHash` |
| **Momo** | HTTPS (redirect + webhook) | e-Wallet payments. HMAC-SHA256 signature verification |
| **SePay** | HTTPS (QR personal + webhook) | Personal bank transfer QR monitoring |
| **OpenAI / Gemini** | HTTPS REST API | AI itinerary generation. Rate limit + provider fallback |
| **Firebase Cloud Messaging** | HTTPS + SDK | Push notifications. Topic-based (vendor) / token-based (tourist) |
| **SMS Provider** | HTTPS API | OTP authentication, notifications. Rate limit: 5 req/min/phone |
| **Weather API** | HTTPS REST | Sầm Sơn weather. Cached 30 min |
| **Object Storage (R2/S3)** | S3-compatible | Media, vendor images, QR codes |

---

## 4. Data Flow Patterns

### 4.1 Voucher Purchase & Redemption

1. Tourist selects service → `POST /orders` → Order + Voucher created (status: `CREATED`)
2. Redirect to payment gateway (VNPay/Momo/SePay)
3. Gateway sends webhook → Payment Service → Voucher updated to `PAID`
4. Notification pushed to tourist ("Voucher ready") and vendor ("New order")
5. Tourist opens voucher → displays QR code
6. Vendor scans QR → `POST /qr/redeem` → Voucher: `REDEEMED`
7. Vendor marks complete → Voucher: `COMPLETED`
8. Settlement Service triggered → commission calculated → disbursement → Voucher: `SETTLED`

### 4.2 Vendor Settlement

- **Immediate:** Settlement job queued immediately on `COMPLETED`
- **Periodic:** Batched (default 3-day cycle)
- Formula: `vendor_amount = customer_paid - commission`
- Retry: 1 hour intervals, max 3 attempts
- Final status: `SETTLED` or `FAILED`

### 4.3 AI Itinerary Generation

1. Tourist submits preferences (budget, dates, interests)
2. AI Service fetches matching services from Vendor Service
3. AI Service calls OpenAI/Gemini with structured prompt
4. LLM returns optimized schedule (structured JSON)
5. Response mapped to platform services with voucher suggestions
6. Tourist can "Book All" or select individual services

---

## 5. API Conventions

### 5.1 Base URL

```
Production:  https://api.S-Loco.vn/v1
Staging:    https://api-staging.S-Loco.vn/v1
Development: http://localhost:3000/v1
```

### 5.2 Authentication

- **Bearer JWT** — access token (15 min TTL), refresh token (30 days, one-time rotation)
- Refresh stored in `httpOnly` cookie (web) or secure storage (mobile)

### 5.3 Response Format

```json
{ "success": true, "data": {...}, "meta": { "request_id": "..." } }
```

**Paginated:**
```json
{ "success": true, "data": [...], "pagination": { "page": 1, "per_page": 20, "total": 150, "total_pages": 8 } }
```

**Error:**
```json
{ "success": false, "error": { "code": "VOUCHER_ALREADY_REDEEMED", "message": "...", "details": [...] } }
```

### 5.4 Key Endpoint Groups

| Group | Prefix | Auth |
|---|---|---|
| Auth | `/v1/auth` | Public / Bearer |
| Vendors | `/v1/vendors` | Public (read) / Bearer (write) |
| Services | `/v1/services` | Public (read) / Bearer (vendor) |
| Combos | `/v1/combos` | Public (read) / Bearer (vendor) |
| Orders | `/v1/orders` | Bearer (tourist) |
| Vouchers | `/v1/vouchers` | Bearer |
| QR | `/v1/qr` | Bearer (vendor) |
| Payments | `/v1/payments` | Bearer / Webhook |
| Settlements | `/v1/settlements` | Bearer (vendor/admin) |
| Content | `/v1/content` | Public / Bearer (admin) |
| AI Itinerary | `/v1/ai` | Bearer (tourist) |
| Notifications | `/v1/notifications` | Bearer |
| Admin | `/v1/admin` | Bearer (admin) |

### 5.5 Rate Limits

| Group | Limit | Window |
|---|---|---|
| Auth (OTP) | 5 req | 1 min / phone |
| Auth (login) | 10 req | 1 min / IP |
| AI Itinerary | 5 req | 1 hour / user |
| General API | 100 req | 1 min / user |

---

## 6. Database Design

### 6.1 Conventions

- **PK:** UUID v7 (time-sortable, distributed-safe)
- **Naming:** `snake_case`
- **Timestamps:** `created_at`, `updated_at` (trigger), `deleted_at` (soft delete)
- **Enums:** PostgreSQL native ENUM for fixed-status fields
- **JSONB:** Flexible metadata only — avoid for frequently-queried fields
- **FKs:** Always with `ON DELETE RESTRICT`

### 6.2 Core Entities

| Entity | Key Fields | Notes |
|---|---|---|
| `users` | phone, email, password_hash, role (tourist/vendor_owner/admin), is_verified | Unique phone (OTP login) |
| `vendors` | owner_id, name, slug, status, commission_rate, settlement_type, geom | PostGIS for geo queries |
| `service_categories` | name, slug, icon_url, sort_order | Top-level taxonomy |
| `services` | vendor_id, category_id, price, discount_price, max_quantity (stock), is_active | Composite covering index |
| `combos` | vendor_id, original_price, combo_price, valid_from, valid_until | Bundle of services |
| `combo_items` | combo_id, service_id, quantity | Many-to-many combo ↔ service |
| `orders` | order_number (unique), customer_id, vendor_id, total_amount, status | Status: created/paid/partially_redeemed/completed/cancelled/refunded |
| `order_items` | order_id, service_id, combo_id, service_name (snapshot), unit_price, quantity | Snapshot of price at order time |
| `vouchers` | voucher_code (unique), qr_token (unique), status | Central entity — see state machine below |
| `payments` | order_id, gateway, transaction_id (unique), idempotency_key (unique), status | Partitioned by `created_at` (monthly) |
| `refunds` | payment_id, order_id, amount, status | pending/approved/processed/rejected |
| `settlements` | vendor_id, total_amount, commission_amount, vendor_amount, voucher_ids (JSONB), status | Periodic batch or immediate |
| `reviews` | customer_id, vendor_id, service_id, rating (1-5), comment, images | Soft delete + visibility flag |
| `news` | slug (unique), author_id, category, is_published | Admin-authored content |
| `events` | title, location, cover_url, start_date, end_date | Time-bound events |
| `weather_cache` | forecast_date, temp_min, temp_max, condition, raw_data | Overwritten daily |
| `ai_itineraries` | customer_id, budget, preferences (JSONB), generated_plan (JSONB), status | generating/ready/expired |
| `itinerary_items` | itinerary_id, service_id, day_number, time_slot, activity_name, notes | AI-generated schedule items |
| `notifications` | user_id, type, title, body, data (deep link), is_read | Cursor-based pagination |
| `audit_log` | table_name, record_id, action, old_data (JSONB), new_data (JSONB), changed_by | Generic audit trail |

### 6.3 Voucher State Machine

```
[*] --> CREATED : Order created
CREATED --> PAID : Payment success
CREATED --> CANCELLED : Order cancel / timeout
PAID --> REDEEMED : Vendor scans QR
PAID --> EXPIRED : Past validity
PAID --> REFUNDED : Tourist refund request
REDEEMED --> COMPLETED : Vendor confirms done
COMPLETED --> SETTLED : Disbursement complete
EXPIRED --> REFUNDED : Auto refund
```

Constraint: only valid transitions allowed (DB trigger or application guard).

### 6.4 Key Indexes

- `idx_services_vendor_category` — `(vendor_id, category_id)` WHERE active + not deleted
- `idx_vouchers_customer_status` — `(customer_id, status)` WHERE paid or redeemed
- `idx_vouchers_vendor_status` — `(vendor_id, status, created_at DESC)`
- `idx_orders_customer` — `(customer_id, created_at DESC)`
- `idx_settlements_vendor` — `(vendor_id, status, created_at DESC)`
- `idx_reviews_vendor` — `(vendor_id, rating, created_at DESC)` WHERE visible + not deleted
- `idx_news_published` — `(published_at DESC)` WHERE published + not deleted

### 6.5 Hot/Cold Data Strategy

| Table | Hot | Cold | Strategy |
|---|---|---|---|
| `vouchers` | paid, redeemed | settled, cancelled | Partial index + archive quarterly |
| `payments` | Last 30 days | > 30 days | Range partition by month |
| `notifications` | Unread + 7 days | > 7 days | TTL cleanup job |
| `weather_cache` | Today + 3 days | Past | Overwrite daily |

---

## 7. Tech Stack Summary

| Layer | Technology |
|---|---|
| Mobile (tourist) | React Native + Expo SDK 52+, Expo Router, Zustand, TanStack Query |
| Mobile (vendor) | React Native + Expo, expo-camera (QR) |
| Admin | Next.js 15 (App Router), shadcn/ui, Tailwind CSS v4, TanStack Table, Recharts |
| API Runtime | Bun 1.x, Hono 4, Zod |
| ORM | Drizzle ORM 0.36+ |
| Database | PostgreSQL 16 (JSONB, unaccent, PostGIS) |
| Cache / Queue | Redis 7 (Valkey), BullMQ |
| Object Storage | Cloudflare R2 (S3-compatible) |
| Auth | Custom JWT (jose), OTP via Redis |
| AI | OpenAI GPT-4o-mini / Gemini 2.0 Flash, Vercel AI SDK |
| Monitoring | Pino, Sentry, Better Stack (Logtail) |
| CI/CD | GitHub Actions |
| Containerization | Docker + Docker Compose |
| Monorepo | Bun workspaces + Turborepo |

---

## 8. Domain Logic Highlights

### 8.1 Voucher Lifecycle

- QR token is a signed JWT — validated server-side on scan
- Price snapshot on `order_items.service_name` + `unit_price` at order time
- `expired_at` configurable per voucher (defaults from service validity)
- Redeem is idempotent (re-scanning same QR returns same result, no double-state)

### 8.2 Settlement Logic

- Commission = `vendor.commission_rate * voucher_amount`
- Vendor receives = `customer_paid - commission`
- Disbursement triggers via BullMQ job (immediate or batched)
- Retry: 1h interval, 3 attempts max, then `FAILED` status
- Vendor settlement summary: `total_revenue`, `total_commission`, `total_withdrawn`

### 8.3 AI Itinerary

- Input: `duration_days`, `budget`, `preferences[]`, `travel_group`, `start_date`
- AI Service fetches live service data before prompting LLM
- LLM response parsed as structured JSON, mapped to actual platform service IDs
- Includes `suggested_vouchers` for direct booking
- Result stored in `ai_itineraries` + `itinerary_items` for history
