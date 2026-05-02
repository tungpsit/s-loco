# S-Loco Architecture

**Source of truth:** `docs/architecture/system-architecture.md`, `database-design.md`, `api-design.md`, `tech-stack.md`

---

## 1. System Overview

S-Loco is a travel super-app targeting Sầm Sơn, Vietnam. The API, admin, and shared packages run in a Bun/TypeScript monorepo; mobile clients are maintained as native Android and iOS apps.

### 1.1 What S-Loco Does

S-Loco connects tourists with local service vendors (restaurants, hotels, spa, electric carts, entertainment, shopping) through a pre-paid voucher system. Tourists buy vouchers on the app, present a QR code at the venue, and the platform handles automatic settlement to vendors with commission deduction.

**Business Model:** Vendor discount 8%, tourist saves 5%, platform keeps 3%.

### 1.2 Monorepo Structure

```
S-Loco/
├── apps/
│   ├── tourist-ios/     # Native iOS tourist app
│   ├── tourist-android/ # Native Android tourist app
│   ├── vendor-ios/      # Native iOS vendor app
│   ├── vendor-android/  # Native Android vendor app
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

- All services share the same PostgreSQL database and Redis instance.
- Services communicate internally (no inter-process networking).
- The Hono API Gateway handles routing, authentication, rate limiting, and delegates to service handlers.
- External integrations (payment gateways, AI, FCM) are accessed via service packages.

---

## 3. Service Boundaries

| Service | Responsibility | Key Dependencies |
|---|---|---|
| **Auth Service** | Register, login (OTP/password), JWT issuance, refresh token rotation, RBAC | Redis (OTP/session store), DB (users) |
| **Booking & Voucher Service** | Order creation, voucher lifecycle (state machine), combo, QR code generation | DB, Redis (cache), Payment Service |
| **Vendor Service** | CRUD vendor, services, categories, media, onboarding, ratings/reviews | DB, Object Storage |
| **Payment Service** | Transaction creation, webhook processing, refunds, retry logic | Payment Gateways (VNPay/Momo/SePay), DB |
| **Settlement Service** | Reconciliation, commission calculation, disbursement (immediate / periodic) | DB, Redis (BullMQ job queue) |
| **Content Service** | News CRUD, events, weather cache | DB, External weather API |
| **AI Itinerary Service** | Receive preferences, fetch matching services, call AI, return optimized itinerary | AI APIs (OpenAI/Gemini), Vendor Service |
| **Notification Service** | Push via FCM, SMS, in-app notifications | FCM, SMS provider, Redis (BullMQ) |

---

## 4. Data Flows

### 4.1 Voucher Purchase & Redemption

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

### 4.2 Vendor Settlement

- **Immediate:** Settlement job queued immediately on `COMPLETED`.
- **Periodic:** Batched (default 3-day cycle).
- **Formula:** `vendor_amount = customer_paid − commission`
  where `commission = 0.08 × customer_paid` (8%)
- **Retry:** 1 hour intervals, max 3 attempts; final status: `SETTLED` or `FAILED`.

### 4.3 AI Itinerary Generation

```
Tourist submits preferences (budget, dates, interests)
  → AI Service fetches matching services from Vendor Service
  → AI Service calls OpenAI / Gemini with structured prompt
  → LLM returns optimized schedule (structured JSON)
  → Response mapped to platform services with voucher suggestions
  → Tourist can "Book All" or select individual services
```

---

## 5. Voucher State Machine

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
| `PAID → REDEEMED` | Vendor scans tourist's QR |
| `PAID → EXPIRED` | Past validity date |
| `PAID → REFUNDED` | Tourist requests refund |
| `REDEEMED → COMPLETED` | Vendor confirms service delivery |
| `COMPLETED → SETTLED` | Settlement disbursement confirmed |
| `EXPIRED → REFUNDED` | Auto refund on expiry |

**Constraint:** Only valid transitions are allowed — enforced via application-level guard or DB trigger.

**Idempotency:** Redeem is idempotent — re-scanning the same QR returns the same result without double-state change.

---

## 6. Settlement Formula

```
commission_amount  = customer_paid × 0.08   (8%)
vendor_amount      = customer_paid − commission_amount
```

**Example (customer pays 100,000 VND):**

| Role | Amount |
|---|---|
| Customer paid | 100,000 VND |
| Commission (S-Loco) | 8,000 VND |
| Vendor receives | 92,000 VND |

---

## 7. External Integrations

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

## 8. Tech Stack Summary

| Layer | Technology |
|---|---|
| Mobile (tourist) | Native iOS (SwiftUI) + native Android (Kotlin/Jetpack Compose) |
| Mobile (vendor) | Native iOS (SwiftUI) + native Android (Kotlin/Jetpack Compose) |
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

## 9. Non-Functional Requirements

| Concern | Requirement |
|---|---|
| **Performance** | API p95 latency < 200 ms for simple reads; < 2 s for AI itinerary generation |
| **Availability** | Target 99.5% uptime; graceful degradation if external APIs fail |
| **Security** | JWT access tokens (15 min TTL), refresh token rotation (30 days), RBAC enforced at API Gateway, OTP rate limited (5/min/phone), webhook signature verification |
| **Scalability** | Stateless API servers behind load balancer; database read replicas for Phase 2+ |
| **Observability** | Structured JSON logs (Pino), `X-Request-ID` correlation across services, Sentry error tracking |
| **Data Integrity** | Idempotency keys on payment/settlement requests; atomic voucher state transitions; audit log for orders/payments/settlements |
| **Localization** | UI strings support Vietnamese (`vi`) and English (`en`); `Accept-Language` header respected |
| **Mobile** | Native iOS and Android clients for tourist and vendor workflows |
