# Phase 1 — Foundation Design Spec

**Phase:** 1 of 6
**Tasks:** FNDN-01, FNDN-02, FNDN-03, FNDN-04, FNDN-05
**Status:** Approved (revised after spec review)
**Author:** Claude (Haki Workflow)
**Date:** 2026-04-09
**Review iterations:** 1 (revised to match existing codebase)

---

## 1. Architecture & Key Decisions

### 1.1 Tech Stack (Foundation Layer)

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Package manager | Bun 1.x, `exact = true` in `bunfig.toml` | Consistent runtime across all apps |
| Build orchestrator | Turborepo v2 | Remote cache + task graphs |
| API framework | Hono v4 (Bun runtime) | Lightweight, edge-ready, Zod native |
| Admin | Next.js 15 (Pages Router) | Per existing codebase |
| Mobile | Expo SDK 52+ | Cross-platform tourist + vendor apps |
| Linter + formatter | Biome v1.9.0 | Single tool, no ESLint/Prettier |
| ORM / Migration | Drizzle ORM v0.45 | Schema as source of truth |
| DB query | Raw `postgres.js` | Flexibility for advanced SQL (fts, advisory locks) |
| DB types | `typeof users.$inferSelect` from Drizzle | Single source for schema types |
| Test runner | Bun test (`bun:test`) | Fast, built-in, no extra deps |
| Package protocol | `workspace:*` | Bun workspaces |

### 1.2 Database Access Pattern (Hybrid)

**Rule:** Drizzle = schema + migrations only. Raw `postgres.js` = queries.

```
packages/db/src/
├── schema/
│   ├── audit.ts           # audit_logs
│   ├── content.ts         # articles, events, ai_itineraries
│   ├── notifications.ts   # notifications
│   ├── orders.ts         # orders, order_items, vouchers, payments, refunds, payment_events, voucher_audit_log
│   ├── reviews.ts        # reviews
│   ├── settlements.ts    # settlements, settlement_items
│   ├── users.ts          # users, user_sessions, otp_codes
│   └── vendors.ts        # vendors, categories, services, combos
├── drizzle.config.ts     # output → ./drizzle/migrations, dialect: postgresql
└── index.ts             # Re-exports schema, types, getDb()

apps/api/src/db/
└── client.ts             # postgres.js singleton (ONLY place with raw SQL)
```

`packages/db/src/index.ts` re-exports:
```ts
// NOTE: import path from packages/db to apps/api
export { getDb } from '../../../apps/api/src/db/client'
export * from './schema/audit'
export * from './schema/content'
export * from './schema/notifications'
export * from './schema/orders'
export * from './schema/reviews'
export * from './schema/settlements'
export * from './schema/users'
export * from './schema/vendors'
```

No other package creates a DB connection. All services import `getDb()` from `@S-Loco/db`.

**Rationale:** Drizzle query builder lacks full support for PostgreSQL-specific features used in S-Loco: full-text search (`tsvector`), advisory locks (settlement concurrency), and complex batch operations. Raw SQL via `postgres.js` gives maximum control while keeping Drizzle as the schema source of truth.

### 1.3 Package Structure

```
s-local/
├── apps/
│   ├── admin/           # Next.js 15, Pages Router
│   ├── api/             # Hono v4, Bun runtime
│   ├── mobile/          # Expo SDK 52+
│   └── vendor/          # Expo SDK 52+
├── packages/
│   ├── db/              # Drizzle schema + types + getDb() re-export
│   └── shared/          # Constants + Zod validators (no server deps)
├── docs/
├── biome.json           # Biome v1.9.0 config at root
├── turbo.json
├── tsconfig.base.json
└── bunfig.toml
```

**Note:** `packages/validators/` is NOT a separate package. Zod validators live in `packages/shared/src/validators/` alongside constants. This avoids duplicate packages and matches the existing codebase.

---

## 2. FNDN-01 — Monorepo Setup

### 2.1 Root Configuration

**`package.json`** (root):
```json
{
  "name": "S-Loco",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "lint": "biome check .",
    "format": "biome format --write .",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "db:generate": "cd packages/db && bun run generate",
    "db:migrate": "cd packages/db && bun run migrate",
    "db:studio": "cd packages/db && bun run studio",
    "dev:api": "cd apps/api && bun dev",
    "dev:admin": "cd apps/admin && bun dev",
    "dev:mobile": "cd apps/mobile && bun",
    "dev:vendor": "cd apps/vendor && bun"
  }
}
```

### 2.2 Turborepo (`turbo.json`)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"] },
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] }
  }
}
```

### 2.3 TypeScript Base (`tsconfig.base.json`)

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

Each app extends with path aliases:
```jsonc
// apps/api/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "paths": {
      "@/*": ["./src/*"],
      "@S-Loco/db": ["../../packages/db/src"],
      "@S-Loco/shared": ["../../packages/shared/src"]
    }
  }
}
```

### 2.4 Biome Config (`biome.json`)

```jsonc
{
  "organizeImports": { "enabled": true },
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded",
      "trailingCommas": "all"
    }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "warn",
        "noUnusedVariables": "warn"
      },
      "style": {
        "noNonNullAssertion": "off"
      }
    },
    "ignore": ["node_modules", "dist", ".next", ".turbo", "drizzle", "bun.lockb"]
  }
}
```

**No ESLint, no Prettier.** Biome is the only linter/formatter.

### 2.5 Validators Location — `packages/shared/src/validators/`

Validators live in `packages/shared/src/validators/` (existing). Files: `auth.ts`, `common.ts`, `order.ts`, `payment.ts`, `service.ts`, `vendor.ts`.

**No separate `packages/validators/` package.** Reuse existing structure.

### 2.6 Validation Commands

| Command | Action |
|---------|--------|
| `bun install` | Installs all workspace deps |
| `bun run lint` | `biome check .` — must pass |
| `bun run typecheck` | `turbo run typecheck` — `tsc --noEmit` everywhere |
| `bun run test` | `turbo run test` — `bun test` everywhere |
| `bun run build` | `turbo run build` — production build |

---

## 3. FNDN-02 — PostgreSQL Database Schema

### 3.1 Schema Architecture

- **Location:** `packages/db/src/schema/`
- **Pattern:** One file per domain (existing files)
- **ORM:** Drizzle ORM v0.45
- **Migrations output:** `packages/db/drizzle/` (NOT inside `src/`)
- **Column naming:** snake_case in SQL, camelCase in TypeScript (Drizzle alias)
- **Monetary columns:** `decimal(precision: 12, scale: 2)` — NOT `integer`. All monetary amounts use precise decimal.
- **JSONB:** Used for flexible fields (`metadata`, `options`, `serviceSnapshot`, `rawWebhook`, `payload`, `oldData`, `newData`, `deviceInfo`)

### 3.2 Enum Types (EXACT — match existing schema)

```ts
// packages/db/src/schema/users.ts
export const userRoleEnum = pgEnum('user_role', ['tourist', 'vendor_owner', 'admin'])

// packages/db/src/schema/orders.ts
export const orderStatusEnum = pgEnum('order_status', ['created', 'paid', 'partially_refunded', 'refunded', 'cancelled'])
export const voucherStatusEnum = pgEnum('voucher_status', ['created', 'paid', 'redeemed', 'completed', 'settled', 'refunded', 'expired', 'cancelled'])
export const paymentGatewayEnum = pgEnum('payment_gateway', ['vnpay', 'momo', 'sepay'])
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'success', 'failed', 'refunded'])

// packages/db/src/schema/vendors.ts
// vendorStatusEnum (see vendors.ts — values: 'pending', 'active', 'suspended', 'rejected')

// packages/db/src/schema/settlements.ts
export const settlementStatusEnum = pgEnum('settlement_status', ['pending', 'approved', 'disbursed', 'rejected'])
```

**Do not change enum values.** All downstream code (services, routes, state machines) depends on these exact strings.

### 3.3 Users & Sessions

```ts
// packages/db/src/schema/users.ts
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: varchar('phone', { length: 20 }).unique(),
  email: varchar('email', { length: 255 }).unique(),
  fullName: varchar('full_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').notNull().default('tourist'),
  passwordHash: text('password_hash'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  uniqueIndex('users_phone_idx').on(t.phone),
  uniqueIndex('users_email_idx').on(t.email),
])

export const userSessions = pgTable('user_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refreshTokenHash: text('refresh_token_hash').notNull(), // hashed, not plain text
  deviceInfo: jsonb('device_info'),
  ipAddress: varchar('ip_address', { length: 45 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('user_sessions_user_id_idx').on(t.userId),
])

export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: varchar('phone', { length: 20 }).notNull(),
  code: varchar('code', { length: 4 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  verified: boolean('verified').notNull().default(false),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('otp_codes_phone_expires_idx').on(t.phone, t.expiresAt),
])
```

### 3.4 Vendor & Service Tables

```ts
// packages/db/src/schema/vendors.ts
// vendorStatusEnum values: 'pending', 'active', 'suspended', 'rejected'

export const vendors = pgTable('vendors', {
  // ... (see existing vendors.ts — includes commissionRate, settlementType, rating, reviewCount)
})

export const categories = pgTable('categories', {
  // ... (includes slug, sortOrder, isActive)
})

export const services = pgTable('services', {
  // ... (includes price decimal, options jsonb, rating, reviewCount)
})

export const combos = pgTable('combos', {
  // ... (includes serviceIds jsonb, validFrom/validUntil timestamps)
})
```

### 3.5 Order & Voucher Tables

```ts
// packages/db/src/schema/orders.ts
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  finalAmount: decimal('final_amount', { precision: 12, scale: 2 }).notNull(),
  status: orderStatusEnum('status').notNull().default('created'),
  note: text('note'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('orders_user_id_idx').on(t.userId),
  index('orders_status_idx').on(t.status),
])

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  serviceId: uuid('service_id').notNull().references(() => services.id),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id),
  comboId: uuid('combo_id').references(() => combos.id),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 12, scale: 2 }).notNull(),
  options: jsonb('options'),
  serviceSnapshot: jsonb('service_snapshot').notNull(), // Frozen service data at purchase time
}, (t) => [
  index('order_items_order_id_idx').on(t.orderId),
])

// Voucher is linked to order_item, NOT directly to order
export const vouchers = pgTable('vouchers', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderItemId: uuid('order_item_id').notNull().references(() => orderItems.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id),
  serviceId: uuid('service_id').notNull().references(() => services.id),
  code: varchar('code', { length: 20 }).notNull().unique(),
  qrToken: text('qr_token'),
  status: voucherStatusEnum('status').notNull().default('created'),
  redeemedAt: timestamp('redeemed_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  settledAt: timestamp('settled_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  version: integer('version').notNull().default(1), // Optimistic locking for concurrent redeem
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('vouchers_code_idx').on(t.code),
  index('vouchers_user_id_idx').on(t.userId),
  index('vouchers_vendor_id_idx').on(t.vendorId),
  index('vouchers_status_idx').on(t.status),
])
```

### 3.6 Payment & Settlement Tables

```ts
// packages/db/src/schema/orders.ts
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  gateway: paymentGatewayEnum('gateway').notNull(),
  gatewayTransactionId: varchar('gateway_transaction_id', { length: 255 }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull().unique(), // Critical for idempotent payment callbacks
  paymentUrl: text('payment_url'), // Redirect URL for payment gateway
  rawWebhook: jsonb('raw_webhook'), // Raw gateway response for debugging
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('payments_order_id_idx').on(t.orderId),
  uniqueIndex('payments_idempotency_key_idx').on(t.idempotencyKey),
])

export const refunds = pgTable('refunds', {
  id: uuid('id').defaultRandom().primaryKey(),
  voucherId: uuid('voucher_id').notNull().references(() => vouchers.id),
  paymentId: uuid('payment_id').notNull().references(() => payments.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  gateway: paymentGatewayEnum('gateway').notNull(),
  gatewayRefundId: varchar('gateway_refund_id', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  reason: text('reason'),
  initiatedBy: uuid('initiated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const voucherAuditLog = pgTable('voucher_audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  voucherId: uuid('voucher_id').notNull().references(() => vouchers.id),
  fromStatus: varchar('from_status', { length: 50 }),
  toStatus: varchar('to_status', { length: 50 }).notNull(),
  actorId: uuid('actor_id').references(() => users.id),
  actorType: varchar('actor_type', { length: 50 }),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const paymentEvents = pgTable('payment_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  gateway: paymentGatewayEnum('gateway').notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull().unique(),
  orderId: uuid('order_id').references(() => orders.id),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  payload: jsonb('payload'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

```ts
// packages/db/src/schema/settlements.ts
// settlementStatusEnum: 'pending', 'approved', 'disbursed', 'rejected'

export const settlements = pgTable('settlements', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  commissionAmount: decimal('commission_amount', { precision: 12, scale: 2 }).notNull(),
  netAmount: decimal('net_amount', { precision: 12, scale: 2 }).notNull(),
  voucherCount: integer('voucher_count').notNull().default(0),
  status: settlementStatusEnum('status').notNull().default('pending'),
  approvedBy: uuid('approved_by').references(() => users.id),
  disbursedAt: timestamp('disbursed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('settlements_vendor_id_idx').on(t.vendorId),
  index('settlements_status_idx').on(t.status),
])

export const settlementItems = pgTable('settlement_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  settlementId: uuid('settlement_id').notNull().references(() => settlements.id, { onDelete: 'cascade' }),
  voucherId: uuid('voucher_id').notNull().references(() => vouchers.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  commission: decimal('commission', { precision: 12, scale: 2 }).notNull(),
})
```

### 3.7 Content, Reviews, Notifications, Audit

Each in its own file under `packages/db/src/schema/`:

| File | Tables | Notes |
|------|--------|-------|
| `audit.ts` | `audit_logs` | `entityType`, `action`, `oldData/newData` jsonb, `performedBy` |
| `content.ts` | `articles`, `events`, `ai_itineraries` | Article types: news/event/guide |
| `notifications.ts` | `notifications` | `userId`, `type`, `title`, `body`, `readAt`, `data` jsonb |
| `reviews.ts` | `reviews` | `userId`, `vendorId`/`serviceId`, `rating 1-5`, `content` |

### 3.8 DB Client

```ts
// apps/api/src/db/client.ts
import postgres from 'postgres'

let _db: ReturnType<typeof postgres> | null = null

export function getDb() {
  if (!_db) {
    _db = postgres(process.env.DATABASE_URL!, {
      max: 10,
      transform: {
        undefined: null,
      },
    })
  }
  return _db
}
```

```ts
// packages/db/src/index.ts
// Correct relative path: from packages/db/src/ to apps/api/src/db/client.ts
export { getDb } from '../../../apps/api/src/db/client'
export * from './schema/audit'
export * from './schema/content'
export * from './schema/notifications'
export * from './schema/orders'
export * from './schema/reviews'
export * from './schema/settlements'
export * from './schema/users'
export * from './schema/vendors'
export type * from './schema'
```

### 3.9 Migration Commands

```jsonc
// packages/db/package.json
{
  "scripts": {
    "generate": "drizzle-kit generate",
    "migrate": "drizzle-kit migrate",
    "studio": "drizzle-kit studio"
  }
}
```

```ts
// packages/db/drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/schema/',
  out: './drizzle/',
  dialect: 'postgresql',
})
```

---

## 4. FNDN-03 — Docker Compose

### 4.1 Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `postgres` | `postgres:16-alpine` | `5432` | Primary database |
| `redis` | `valkey/valkey:7-alpine` | `6379` | Cache + queue |
| `minio` | `minio/minio:latest` | `9000`, `9001` | S3-compatible object storage |

All services have **health checks** and **named volumes** for data persistence.

### 4.2 Configuration

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: sloco
      POSTGRES_USER: sloco
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-sloco123}
    ports: ['5432:5432']
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U sloco']
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: valkey/valkey:7-alpine
    ports: ['6379:6379']
    volumes:
      - redisdata:/data
    healthcheck:
      test: ['CMD-SHELL', 'valkey-cli ping']
      interval: 5s
      timeout: 3s
      retries: 5

  minio:
    image: minio/minio:latest
    ports: ['9000:9000', '9001:9001']
    environment:
      MINIO_ROOT_USER: ${MINIO_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD:-minioadmin}
    volumes:
      - miniodata:/data
    command: server /data --console-address ':9001'
    healthcheck:
      test: ['CMD-SHELL', 'mc ready local']
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  pgdata:
  redisdata:
  miniodata:
```

**Note on MinIO healthcheck:** `curl` is not available in the MinIO image by default. Use `mc ready local` (MinIO Client) or a file-based check. The `CMD-SHELL` wrapper ensures shell is available.

### 4.3 Environment Variables

```env
# .env.example
DATABASE_URL=postgresql://sloco:sloco123@localhost:5432/sloco
REDIS_URL=redis://localhost:6379
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=sloco
POSTGRES_PASSWORD=sloco123
```

### 4.4 Integration Points

- `apps/api/src/db/client.ts` reads `DATABASE_URL`
- `apps/api/src/lib/redis.ts` reads `REDIS_URL` (falls back to `redis://localhost:6379`)
- Object storage uses `MINIO_*` env vars for R2/S3-compatible uploads

---

## 5. FNDN-04 — CI Pipeline

### 5.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [master]
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with: { bun-version: 1.x }
      - run: bun install --frozen-lockfile
      - run: bun run lint
      - run: bun run typecheck
      - run: bun run test
```

**Note on `bun-version`:** Use `1.x` (pin to major) rather than `latest` for reproducibility. The lockfile was generated with Bun 1.x and `latest` could resolve differently.

### 5.2 Pipeline Behavior

- **Lint** (`biome check`) runs first — catches style issues before typecheck.
- **Typecheck** (`turbo run typecheck`) runs `tsc --noEmit` in all apps/packages.
- **Test** (`turbo run test`) runs `bun test` via Turborepo — parallelized across packages.
- **`--frozen-lockfile`** prevents accidental lockfile drift.
- Biome `ignore` already excludes `node_modules`, `dist`, `.next`, `.turbo`, `drizzle`, `bun.lockb` — no path filtering needed in CI.
- **No remote cache** configured by default (Turborepo remote cache is opt-in via `TURBO_TOKEN`).

---

## 6. FNDN-05 — Shared Constants

### 6.1 Constants File — Existing

```ts
// packages/shared/src/constants.ts (already exists — do not duplicate)
export const USER_ROLES = ['tourist', 'vendor_owner', 'admin'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const VOUCHER_STATUSES = ['created', 'paid', 'redeemed', 'completed', 'settled', 'refunded', 'expired', 'cancelled'] as const
export const ORDER_STATUSES = ['created', 'paid', 'partially_refunded', 'refunded', 'cancelled'] as const
export const VENDOR_STATUSES = ['pending', 'active', 'suspended', 'rejected'] as const
export const PAYMENT_GATEWAYS = ['vnpay', 'momo', 'sepay'] as const
export const PAYMENT_STATUSES = ['pending', 'success', 'failed', 'refunded'] as const
export const SETTLEMENT_STATUSES = ['pending', 'approved', 'disbursed', 'rejected'] as const
export const SERVICE_CATEGORIES = [
  { slug: 'am-thuc', name: 'Ẩm thực', icon: '🍜' },
  { slug: 'luu-tru', name: 'Lưu trú', icon: '🏨' },
  { slug: 'spa-massage', name: 'Spa & Massage', icon: '💆' },
  { slug: 'xe-dien', name: 'Xe điện', icon: '🛺' },
  { slug: 'giai-tri', name: 'Giải trí', icon: '🎠' },
  { slug: 'mua-sam', name: 'Mua sắm', icon: '🛍️' },
] as const

export const APP_CONSTANTS = {
  OTP_LENGTH: 4,
  OTP_EXPIRY_SECONDS: 300,
  OTP_MAX_ATTEMPTS: 5,
  OTP_RATE_LIMIT_PER_MINUTE: 5,
  ACCESS_TOKEN_TTL_SECONDS: 900,
  REFRESH_TOKEN_TTL_DAYS: 30,
  DEFAULT_COMMISSION_RATE: 8.0,
  TOURIST_DISCOUNT_RATE: 5.0,
  PLATFORM_FEE_RATE: 3.0,
  MAX_ITEMS_PER_PAGE: 100,
  DEFAULT_ITEMS_PER_PAGE: 20,
} as const
```

### 6.2 Validators — Existing Location

Validators are in `packages/shared/src/validators/`. Files: `auth.ts`, `common.ts`, `order.ts`, `payment.ts`, `service.ts`, `vendor.ts`.

```ts
// packages/shared/src/validators/auth.ts (already exists)
export const sendOtpSchema = z.object({
  phone: z.string().regex(/^(0|\+84)\d{9,10}$/, 'Số điện thoại không hợp lệ...'),
})
export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^(0|\+84)\d{9,10}$/),
  code: z.string().length(4, 'Mã OTP phải 4 chữ số'),
  full_name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  device_info: z.record(z.unknown()).optional(),
})
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
})
```

**No changes needed to existing validator files.** They already exist and are correct.

---

## 7. Acceptance Criteria Checklist

| Task | Criterion | Status |
|------|----------|--------|
| FNDN-01 | `bun install` succeeds across all packages | |
| FNDN-01 | `bun run lint` passes everywhere | |
| FNDN-01 | `bun run typecheck` passes everywhere | |
| FNDN-01 | `turbo.json` defines build/test/lint tasks | |
| FNDN-01 | `biome.json` at root, correct config | |
| FNDN-01 | All apps can import `@S-Loco/db`, `@S-Loco/shared` | |
| FNDN-02 | All schema files present in `packages/db/src/schema/` | |
| FNDN-02 | Enum values match exactly as specified | |
| FNDN-02 | Monetary columns use `decimal(12, 2)` | |
| FNDN-02 | `serviceSnapshot` present on `orderItems` | |
| FNDN-02 | `idempotencyKey` present on `payments` | |
| FNDN-02 | `settlementItems` present | |
| FNDN-02 | `auditLogs`, `voucherAuditLog`, `paymentEvents` present | |
| FNDN-02 | `drizzle.config.ts` outputs to `./drizzle/` | |
| FNDN-02 | Correct relative path in `packages/db/src/index.ts` | |
| FNDN-03 | `docker compose up` starts postgres + redis + minio | |
| FNDN-03 | Health checks use `CMD-SHELL` (no curl dependency) | |
| FNDN-03 | `.env.example` documents all required variables | |
| FNDN-04 | CI runs lint + typecheck + test on push/PR | |
| FNDN-04 | `--frozen-lockfile` enforced | |
| FNDN-04 | `bun-version: 1.x` (not `latest`) | |
| FNDN-05 | Constants in `packages/shared/src/constants.ts` (no duplication) | |
| FNDN-05 | Validators in `packages/shared/src/validators/` (no new package) | |
| FNDN-05 | All schemas export TypeScript types | |

---

*Spec written: 2026-04-09*
*Approved by: user (haki workflow)*
*Review iterations: 1*
