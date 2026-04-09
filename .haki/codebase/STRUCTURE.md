# S-Loco Codebase Structure

> Project name: **S-Loco**. A Vietnamese coastal lifestyle / booking platform.
> Monorepo managed by **Turbo** (Bun workspaces). Scanned: 2026-04-02.

---

## 1. Top-Level Directory Tree

```
s-local/                     <- monorepo root
+-- apps/
|   +-- admin/               # Admin dashboard (Next.js)
|   +-- api/                 # API server (Hono/Bun)
|   +-- mobile/              # Customer mobile app (Expo/React Native)
|   +-- vendor/              # Vendor mobile app (Expo/React Native)
+-- packages/
|   +-- db/                  # Drizzle ORM schema + seed
|   +-- shared/              # Shared TypeScript types, validators, constants
+-- docs/
|   +-- architecture/
|   +-- images/
+-- node_modules/            # Hoisted workspace dependencies
+-- .haki/codebase/
|   +-- STRUCTURE.md         # This file
+-- biome.json               # Linter/formatter config (Biome)
+-- bunfig.toml              # Bun configuration
+-- docker-compose.yml       # PostgreSQL, Redis, API, Admin services
+-- package.json             # Root workspace manifest
+-- tsconfig.base.json       # Shared TypeScript base config
```
## 2. Entry Points

### apps/api -- API Server
- **Entry point:** `apps/api/src/index.ts`
- **Runtime:** Bun (`bun run --hot src/index.ts`)
- **Framework:** Hono v4
- **Port:** `process.env.PORT` or `3000`
- **Base URL (local dev):** `http://localhost:3000`
- **Docker service name:** `api:3000`

### apps/admin -- Admin Dashboard
- **Entry point:** Next.js (`apps/admin/src/`), standard Next.js file-based routing
- **Dev command:** `next dev --turbopack --port 3001`
- **Port:** `3001`
- **Docker service name:** `admin:3001`

### apps/mobile -- Customer Mobile App
- **Entry point:** `expo-router/entry` (configured in `package.json` as `main`)
- **Dev command:** `expo start` (port `8081` by default)
- **Pages:** File-based routing under `apps/mobile/app/`

### apps/vendor -- Vendor Mobile App
- **Entry point:** `expo-router/entry`
- **Dev command:** `expo start`
- **Pages:** File-based routing under `apps/vendor/app/`

---

## 3. Configuration Files

| File | Purpose |
|------|---------|
| `turbo.json` | Turbo pipeline: `dev`, `build`, `lint`, `check`, `db:*` tasks |
| `biome.json` | Biome linter/formatter rules (indent 2 spaces, 100-char line width, single quotes) |
| `bunfig.toml` | Bun runtime configuration |
| `tsconfig.base.json` | Shared TypeScript base config (referenced by workspace `tsconfig.json`s) |
| `docker-compose.yml` | Local dev stack: PostgreSQL 16, Redis 7, API, Admin (see section 7) |
| `apps/api/Dockerfile` | Builds the Hono API into a production image |
| `apps/admin/Dockerfile` | Builds the Next.js admin dashboard |

> **No `.env` file is present in the repo.** Environment variables are injected via `docker-compose.yml` for local dev and are not tracked in source control. Applications expect: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `QR_JWT_SECRET`, `VNPAY_HASH_SECRET`, `MOMO_SECRET_KEY`, `SEPAY_SECRET_KEY`, `PORT`, `NODE_ENV`, `APP_URL`, and (admin only) `NEXT_PUBLIC_API_URL`.
---

## 4. Source Code vs. Tests vs. Docs

### Source Code
- All application code lives in `apps/` and `packages/`.

### Tests
- Tests for `apps/api` are located in `apps/api/tests/`. Run with `bun test tests/`.
- No test directories were found in `apps/admin`, `apps/mobile`, `apps/vendor`, or either `packages/` directory.

### Documentation
- `docs/` -- architecture decision records (ADRs), API docs, system design
- `docs/openapi.yaml` -- OpenAPI 3.0 spec served by the API at `GET /openapi.yaml`
- `CLAUDE.md` / `DESIGN.md` at root -- project-level instructions for AI assistants
- Each app has its own `CLAUDE.md` and/or `AGENTS.md` with framework-specific notes
- `packages/db/src/seed.ts` -- database seed script

---

## 5. Monorepo Layout

### Workspaces (`package.json` `workspaces` field)
```
apps/*   packages/*
```

### Apps (`apps/`)
| Package | Type | Key Deps |
|---------|------|----------|
| `@S-Loco/api` | Hono/Bun REST API | `hono`, `zod`, `jose`, `ioredis`, `drizzle-orm`, `@S-Loco/db`, `@S-Loco/shared` |
| `@S-Loco/admin` | Next.js 16 (App Router) | `next`, `react`, `zustand`, `@tanstack/react-query`, `@S-Loco/shared` |
| `@s-local/mobile` | Expo 55 (React Native) | `expo`, `expo-router`, `zustand`, `@tanstack/react-query`, `@S-Loco/shared` |
| `@S-Loco/vendor` | Expo 55 (React Native) | `expo`, `expo-router`, `zustand`, `@tanstack/react-query`, `@S-Loco/shared` |

### Packages (`packages/`)
| Package | Role |
|---------|------|
| `@S-Loco/db` | Drizzle ORM schema (PostgreSQL), DB client factory (`createDb`/`getDb`), seed script |
| `@S-Loco/shared` | Pure TypeScript: shared type aliases (`ApiResponse`, `UUID`, `VND`), Zod validators, constants |

### Turbo Tasks (from `turbo.json`)
```
dev         <- persistent dev servers (no cache)
build       <- builds all packages, dependsOn ^build (outputs: dist/**, .next/**)
lint        <- biome check, dependsOn ^lint
check       <- tsc --noEmit, dependsOn ^check
db:generate <- drizzle-kit generate
db:migrate  <- drizzle-kit migrate
db:push     <- drizzle-kit push
db:seed     <- bun run src/seed.ts
db:studio   <- drizzle-kit studio (persistent)
```
---

## 6. Key File Responsibilities

### apps/api/src/index.ts
Root Hono application. Sets up CORS (allows localhost:3001, localhost:3002, localhost:8081), global logger, error handler, health check at GET /health, OpenAPI docs at GET /docs, and mounts all v1 route modules under /api/v1.

### API Routes (apps/api/src/routes/)
Each route file registers a sub-router on a path segment:

| File | Path |
|------|------|
| `auth.ts` | `/api/v1/auth` |
| `vendors.ts` | `/api/v1/vendors` |
| `services.ts` | `/api/v1/services` |
| `orders.ts` | `/api/v1/orders` |
| `vouchers.ts` | `/api/v1/vouchers` |
| `payments.ts` | `/api/v1/payments` |
| `settlements.ts` | `/api/v1/settlements` |
| `notifications.ts` | `/api/v1/notifications` |
| `dashboard.ts` | `/api/v1/dashboard` |
| `combos.ts` | `/api/v1/combos` |
| `content.ts` | `/api/v1/content` |
| `itinerary.ts` | `/api/v1/itinerary` |
| `reviews.ts` | `/api/v1/reviews` |
| `admin.ts` | `/api/v1/admin` |

### API Services (apps/api/src/services/)
Business-logic layer consumed by routes. Each service maps to one route:

| File | Responsibility |
|------|----------------|
| `auth.service.ts` | Login, register, OTP, token refresh |
| `token.service.ts` | JWT issuance and verification |
| `otp.service.ts` | OTP generation/delivery |
| `vendor.service.ts` | Vendor CRUD, profile |
| `service.service.ts` | Service (experience) CRUD |
| `order.service.ts` | Order lifecycle |
| `voucher.service.ts` | Voucher lifecycle |
| `voucher-state.ts` | Voucher state machine |
| `payment.service.ts` | Payment orchestration |
| `payment-gateway.ts` | Abstract payment gateway interface |
| `settlement.service.ts` | Vendor settlement logic |
| `notification.service.ts` | Push/notification dispatch |
| `dashboard.service.ts` | Aggregated dashboard data |
| `combo.service.ts` | Combo/package bundles |
| `content.service.ts` | CMS content |
| `itinerary.service.ts` | Trip itinerary generation |
| `review.service.ts` | Review/rating management |
| `discovery.service.ts` | Search and discovery |
| `admin.service.ts` | Platform admin operations |
| `qr.service.ts` | QR code generation for vouchers |
| `lib/password.ts` | Password hashing |

### API Middleware (apps/api/src/middleware/)
| File | Purpose |
|------|---------|
| `auth.ts` | JWT verification middleware |
| `rate-limit.ts` | Rate limiting (likely backed by Redis) |

### API Jobs (apps/api/src/jobs/)
| File | Purpose |
|------|---------|
| `auto-confirm.ts` | Cron job: auto-confirm expired orders |
| `settlement-batch.ts` | Cron job: batch vendor settlements |

### API Gateways (apps/api/src/gateways/)
Payment gateway integrations:
- `vnpay.ts`
- `momo.ts`
- `sepay.ts`

### packages/db/src/schema/ -- Drizzle Schema Modules
| File | Tables / Purpose |
|------|-----------------|
| `users.ts` | User accounts |
| `vendors.ts` | Vendor profiles and settings |
| `orders.ts` | Order / booking records |
| `settlements.ts` | Vendor settlement records |
| `reviews.ts` | Review and rating records |
| `content.ts` | CMS content blocks |
| `notifications.ts` | Push notification records |
| `audit.ts` | Audit log entries |
| `index.ts` | Barrel re-export of all schema modules |
| `relations.ts` | Drizzle relational query config |

`packages/db/src/index.ts` -- Exports `createDb(url?)` factory and singleton `getDb()`. Re-exports all schema and relations.

`packages/db/drizzle.config.ts` -- Drizzle Kit config pointing schema at `./src/schema`, output at `./drizzle`.

`packages/db/src/seed.ts` -- Database seed script (run via `turbo db:seed --filter=@S-Loco/db`).

### packages/shared/src/ -- Shared Exports

| File | Exports |
|------|--------|
| `index.ts` | `ApiSuccessResponse<T>`, `ApiErrorResponse`, `ApiResponse<T>`, `PaginationMeta`, `PaginatedResponse<T>`, branded `UUID`, branded `VND` |
| `constants.ts` | Shared constants |
| `validators/index.ts` | Barrel re-export of all Zod schemas |
| `validators/auth.ts` | Zod schema for auth payloads |
| `validators/common.ts` | Zod schema for common types |
| `validators/order.ts` | Zod schema for order payloads |
| `validators/payment.ts` | Zod schema for payment payloads |
| `validators/service.ts` | Zod schema for service payloads |
| `validators/vendor.ts` | Zod schema for vendor payloads |

### apps/admin/src/ -- Next.js Admin App

```
src/
+-- app/                          # Next.js App Router
|   +-- layout.tsx                # Root layout
|   +-- page.tsx                  # Root redirect or landing
|   +-- login/page.tsx            # Login page
|   +-- globals.css               # Tailwind CSS v4 global styles
|   +-- dashboard/
|       +-- layout.tsx            # Dashboard shell (sidebar)
|       +-- page.tsx              # Dashboard home
|       +-- orders/page.tsx
|       +-- vendors/page.tsx
|       +-- settlements/page.tsx
|       +-- content/page.tsx
|       +-- ...                    # Additional dashboard pages
+-- components/
|   +-- providers.tsx             # React Query + Zustand providers
|   +-- sidebar.tsx              # Navigation sidebar
+-- lib/
    +-- api.ts                    # API client (fetch wrapper)
    +-- auth-context.tsx          # Auth state via React Context / Zustand
```

### apps/mobile/app/ -- Customer Mobile (Expo Router)

```
app/
+-- _layout.tsx                   # Root expo-router layout
+-- (tabs)/                       # Tab navigator
    +-- _layout.tsx
    +-- index.tsx                 # Home / discovery
    +-- search.tsx                # Search screen
    +-- vouchers.tsx              # My vouchers
    +-- profile.tsx               # User profile
```

Supporting lib files:
- `apps/mobile/lib/api.ts` -- API client
- `apps/mobile/lib/theme.ts` -- Theme constants

### apps/vendor/app/ -- Vendor Mobile (Expo Router)

```
app/
+-- _layout.tsx                   # Root expo-router layout
+-- (tabs)/                       # Tab navigator
    +-- _layout.tsx
    +-- index.tsx                 # Home / overview
    +-- scan.tsx                  # QR code scanner (voucher redemption)
    +-- earnings.tsx              # Earnings / settlements
    +-- settings.tsx             # Vendor settings
```

Supporting lib files:
- `apps/vendor/lib/api.ts` -- API client
---

## 7. Docker Compose Services

docker-compose.yml defines four services:

| Service | Image | Port | Key Env Vars |
|---------|-------|------|-------------|
| `postgres` | `postgres:16-alpine` | `5432` | `POSTGRES_USER=sloco`, `POSTGRES_PASSWORD=sloco_dev_2026`, `POSTGRES_DB=sloco` |
| `redis` | `redis:7-alpine` | `6379` | -- |
| `api` | built from `apps/api/Dockerfile` | `3000` | `DATABASE_URL`, `REDIS_URL`, all JWT/payment secrets |
| `admin` | built from `apps/admin/Dockerfile` | `3001` | `NEXT_PUBLIC_API_URL=http://api:3000/api/v1` |

Both databases use named volumes (`pgdata`, `redisdata`).

---

## 8. Public API Summary

The API exposes the following top-level route groups under `http://localhost:3000/api/v1/`:

```
GET  /health                          <- health check (no auth)
GET  /docs                             <- HTML API reference (Scalar)
GET  /openapi.yaml                     <- OpenAPI 3.0 spec

POST /api/v1/auth/...                  <- Auth: login, register, OTP, refresh
GET  /api/v1/vendors/...               <- Vendor search, profile
GET  /api/v1/services/...              <- Service/experience listing
POST /api/v1/orders/...                <- Order creation, status
GET  /api/v1/vouchers/...              <- Voucher retrieval, redemption
POST /api/v1/payments/...              <- Payment initiation, callback
GET  /api/v1/settlements/...           <- Settlement history
GET  /api/v1/notifications/...          <- User notifications
GET  /api/v1/dashboard/...             <- Dashboard aggregates
GET  /api/v1/combos/...                <- Combo/package bundles
GET  /api/v1/content/...               <- CMS content
GET  /api/v1/itinerary/...             <- Trip itinerary generation
GET  /api/v1/reviews/...              <- Reviews
GET  /api/v1/admin/...                 <- Admin-only operations
```

Authentication is JWT-based (access + refresh tokens issued by auth.service.ts / token.service.ts). Most routes are protected by apps/api/src/middleware/auth.ts. Payment callbacks from vnpay, momo, sepay are handled in apps/api/src/gateways/.

> **Note:** The OpenAPI spec is the authoritative API contract -- it is served live from apps/api/src/index.ts at GET /openapi.yaml and also lives at docs/openapi.yaml.
