# Architecture Research: Local Tourism Voucher Platform

## System Components

### 1. API Server (Hono + Bun)

Single Hono application with modular route groups (not microservices — monolith-first for v1).

```
apps/api/
├── src/
│   ├── index.ts              # Hono app entry
│   ├── middleware/            # Auth, rate-limit, error handler, cors
│   ├── routes/               # Route handlers grouped by domain
│   │   ├── auth.ts
│   │   ├── vendors.ts
│   │   ├── services.ts
│   │   ├── orders.ts
│   │   ├── vouchers.ts
│   │   ├── payments.ts
│   │   ├── settlements.ts
│   │   ├── content.ts
│   │   ├── ai.ts
│   │   └── admin.ts
│   ├── services/             # Business logic layer
│   │   ├── auth.service.ts
│   │   ├── voucher.service.ts
│   │   ├── payment.service.ts
│   │   └── ...
│   └── lib/                  # Utilities, constants, types
```

**Key Pattern:** Routes → Services → DB (via Drizzle). Services contain business logic. Routes handle HTTP concerns.

### 2. Database Layer (Drizzle + PostgreSQL)

```
packages/db/
├── src/
│   ├── index.ts              # drizzle() client export
│   ├── schema/               # Table definitions
│   │   ├── users.ts
│   │   ├── vendors.ts
│   │   ├── services.ts
│   │   ├── orders.ts
│   │   ├── vouchers.ts
│   │   ├── payments.ts
│   │   └── ...
│   └── relations.ts          # Drizzle relations
├── drizzle/                   # Generated migrations
└── drizzle.config.ts
```

### 3. Mobile Apps (Expo)

Two separate Expo apps sharing packages:
- `apps/mobile` — Tourist-facing
- `apps/vendor` — Vendor-facing

```
apps/mobile/
├── app/                      # file-based routes (Expo Router)
│   ├── (tabs)/               # Tab navigation
│   │   ├── index.tsx         # Home/discovery
│   │   ├── search.tsx        # Search services
│   │   ├── vouchers.tsx      # My vouchers
│   │   └── profile.tsx       # Profile
│   ├── vendor/[id].tsx       # Vendor detail
│   ├── service/[id].tsx      # Service detail
│   ├── order/[id].tsx        # Order detail
│   └── auth/                 # Login/OTP flow
├── components/
├── hooks/
├── stores/                   # Zustand stores
└── services/                 # API client (TanStack Query)
```

### 4. Admin Dashboard (Next.js)

```
apps/admin/
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx          # Dashboard stats
│   │   ├── vendors/          # Vendor management
│   │   ├── orders/           # Order management
│   │   ├── settlements/      # Settlement management
│   │   ├── content/          # News/events CMS
│   │   └── users/            # User management
│   └── auth/
│       └── login/            # Admin login
```

## Data Flow

```
Tourist App ──→ API Server ──→ Service Layer ──→ Drizzle ──→ PostgreSQL
                    ↕                ↕
              Redis (cache)    Payment Gateway webhook
                    ↕                ↕
            BullMQ (jobs) ←── Settlement/Notification triggers
```

### Critical Flow: Voucher Purchase

1. Tourist selects service → POST /orders
2. API creates Order (CREATED) + Voucher (CREATED)
3. API creates Payment intent → returns payment_url
4. Tourist redirects to payment gateway
5. Gateway sends webhook → POST /payments/webhook/{gateway}
6. API verifies signature, updates Payment (SUCCESS)
7. API updates Voucher (CREATED → PAID)
8. BullMQ job: send push notification to tourist + vendor

### Critical Flow: QR Redemption

1. Tourist shows QR / Vendor shows QR
2. Scanner app → POST /qr/redeem with qr_token
3. API validates token (signed JWT with voucher_id)
4. API updates Voucher (PAID → REDEEMED)
5. Push notification to both parties

## Build Order (dependencies between components)

| Phase | Components | Dependency |
|-------|-----------|------------|
| 1 | Monorepo, DB schema, Auth | Foundation |
| 2 | Vendor/Service CRUD, Admin basics | Needs Auth |
| 3 | Orders, Vouchers, QR | Needs Services |
| 4 | Payment integration, Webhooks | Needs Orders |
| 5 | Settlement, Notifications | Needs Payments |
| 6 | Mobile app (Tourist), Vendor app | Needs API |
| 7 | AI Itinerary, Combos, Content | Needs Services |
| 8 | Polish, Testing, Deployment | Needs all |

---
*Researched: 2026-03-22*
