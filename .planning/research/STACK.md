# Stack Research: Local Tourism Voucher Super-App

## Recommended Stack (2025/2026)

### Backend Runtime & Framework

| Component | Recommendation | Version | Confidence |
|-----------|---------------|---------|------------|
| **Runtime** | Bun | 1.1+ | ✅ High — Native TS, 3x HTTP perf vs Node.js |
| **Framework** | Hono | 4+ | ✅ High — 14KB, Web Standards, Bun-native, Zod OpenAPI |
| **Validation** | Zod + @hono/zod-validator | 3.x | ✅ High — Shared schemas FE/BE |
| **ORM** | Drizzle ORM (pg-core) | 0.36+ | ✅ High — Type-safe SQL, zero overhead, Bun-SQL native |
| **Auth** | Custom JWT (jose) | 5.x | ✅ High — Lightweight, full control over token rotation |

**Rationale:** Hono + Bun is the fastest lightweight stack for REST APIs. Drizzle ORM with `drizzle-orm/bun-sql` provides native Bun SQL driver integration (no pg dependency needed). OpenAPIHono from `@hono/zod-openapi` auto-generates API docs from Zod schemas.

### Database & Infrastructure

| Component | Recommendation | Version | Confidence |
|-----------|---------------|---------|------------|
| **Primary DB** | PostgreSQL | 16+ | ✅ High — ACID for payments, JSONB, full-text search |
| **Cache/Queue** | Redis (Valkey) | 7+ | ✅ High — Sessions, OTP, BullMQ jobs |
| **Job Queue** | BullMQ | 5.x | ✅ High — Redis-backed, dashboard UI, retries |
| **Object Storage** | Cloudflare R2 / RustFS | — | ✅ High — S3-compatible, free egress |

### Frontend — Mobile (Tourist + Vendor)

| Component | Recommendation | Version | Confidence |
|-----------|---------------|---------|------------|
| **Framework** | React Native + Expo | SDK 52+ | ✅ High — Cross-platform, OTA updates, PWA export |
| **Routing** | Expo Router (file-based) | v4 | ✅ High — Deep linking, typed routes |
| **State** | Zustand + TanStack Query | 5.x / 5.x | ✅ High — Client/server state separation |
| **Forms** | React Hook Form + Zod | 7.x / 3.x | ✅ High — Shared validators with backend |
| **QR** | expo-camera | — | ✅ High — Built-in barcode scanning |

### Frontend — Admin Dashboard

| Component | Recommendation | Version | Confidence |
|-----------|---------------|---------|------------|
| **Framework** | Next.js | 15+ | ✅ High — RSC, SSR for SEO, App Router |
| **UI** | shadcn/ui + Tailwind CSS | v4 | ✅ High — Beautiful, accessible, customizable |
| **Tables** | TanStack Table | 8.x | ✅ High — Complex data grids |
| **Charts** | Recharts | 2.x | ✅ High — Revenue dashboards |

### Payment Gateways (Vietnam-specific)

| Gateway | Use Case | Confidence |
|---------|----------|------------|
| **VNPay** | Bank cards, QR banking | ✅ High — Most popular in Vietnam |
| **Momo** | Mobile wallet | ✅ High — Popular mobile payment |
| **SePay** | Personal QR transfer | ⚠️ Medium — Good for small vendors but less documented |

## What NOT to Use

| Technology | Why Not |
|-----------|---------|
| Express.js | Legacy, no native TS, heavier than Hono |
| NestJS | Over-engineered for this project size, decorator overhead |
| Prisma | Requires binary engine (Bun incompatible), slower cold start |
| MongoDB | No ACID for payment/voucher transactions |
| Redux | Over-engineered for mobile — Zustand is sufficient |
| Supabase Auth | Over-abstraction for custom OTP flow |

---
*Researched: 2026-03-22*
