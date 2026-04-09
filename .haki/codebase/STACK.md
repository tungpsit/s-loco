# S-Loco Tech Stack

Monorepo at `D:/workspace/s-local` managed with **Bun workspaces** + **Turbo**.

---

## Languages

| Language | Version | Notes |
|---|---|---|
| TypeScript | `^5.7.0` (root), `5.9.3` (mobile/vendor), `^5.7.0` (packages) | `tsconfig.base.json`: `target: ESNext`, `module: ESNext`, `moduleResolution: bundler`, strict |
| Bun | `1.3.4` (package manager, locked in `package.json`) | Also runtime for API |
| CSS | — | Tailwind CSS v4 in admin via `@tailwindcss/postcss` |

**Root `package.json` override:** `@types/react: ~18.3.0` (pinned across all workspaces)

---

## Monorepo Structure

- **Package manager:** Bun `1.3.4` (`bun.lock`, `bun.lockb`)
- **Bun config:** `bunfig.toml` — exact versions enforced (`install.exact = true`), lockfile saved
- **Task runner:** Turbo `^2.3.0` (`turbo.json`)
- **Workspaces:** `apps/*`, `packages/*`
- **Linter/Formatter:** Biome `^1.9.0` (`biome.json`)

---

## Apps

### `@S-Loco/api` (`apps/api`)
Hono.js REST API, runs on **Bun**.

**Dev:** `bun run --hot src/index.ts`
**Build:** `bun build src/index.ts --target=bun --outdir=./dist`
**Test:** `bun test tests/`
**Docker:** multi-stage from `oven/bun:1.2`, slim production image; CMD: `bun run dist/index.js`

**Dependencies:**
- `hono` `^4.6.0`
- `@hono/zod-openapi` `^0.18.0` — OpenAPI schema generation
- `@hono/zod-validator` `^0.4.0` — Zod request/response validation
- `zod` `^3.24.0`
- `jose` `^5.9.0` — JWT
- `ioredis` `^5.4.0` — Redis client
- `drizzle-orm` `^0.38.0`
- `@S-Loco/db` + `@S-Loco/shared` (workspace:*)

---

### `@S-Loco/admin` (`apps/admin`)
Next.js 16 (App Router), runs on **Node.js 22**.

**Dev:** `next dev --turbopack --port 3001`
**Build:** `next build`
**Docker:** multi-stage from `node:22-alpine`; uses `pnpm` during Docker build, outputs standalone server on port `3001`

**Dependencies:**
- `next` `16.2.1`
- `react` `19.2.4` / `react-dom` `19.2.4`
- `tailwindcss` `^4` + `@tailwindcss/postcss` `^4` (config: `postcss.config.mjs`)
- `zustand` `^5.0.0`
- `@tanstack/react-query` `^5.62.0`
- `@S-Loco/shared` (workspace:*)

**Trusted native deps:** `sharp`, `unrs-resolver` (marked in `package.json`)

---

### `@s-local/mobile` (`apps/mobile`)
Expo mobile app (customer-facing).

**Dev:** `expo start` (Android / iOS / web targets)
**Entry:** `expo-router/entry`

**Dependencies:**
- `expo` `55.0.8`
- `expo-router` `55.0.7`
- `react-native` `0.84.1`
- `react` `19.2.4`
- `@react-native-async-storage/async-storage` `3.0.1`
- `@react-navigation/bottom-tabs` `^7.0.0`
- `@tanstack/react-query` `^5.62.0`
- `zustand` `5.0.12`
- `react-dom` `19.2.4` + `react-native-web` `0.21.2` (web target)

---

### `@S-Loco/vendor` (`apps/vendor`)
Separate Expo app (vendor-facing). Near-identical stack to `@s-local/mobile`.

**Differences from mobile:**
- `@tanstack/react-query` `^5.94.5`
- `@react-navigation/bottom-tabs` `7.15.6`
- `expo-router` `55.0.7` (same as mobile)
- Entry: `expo-router/entry`

---

## Packages

### `@S-Loco/db` (`packages/db`)
Database schema and migrations via Drizzle.

- `drizzle-orm` `0.45.1` (consumed by API as `^0.38.0`)
- `pg` `^8.13.0` — PostgreSQL driver
- `drizzle-kit` `0.31.10` — migrations + studio
- Config: `packages/db/drizzle.config.ts` — dialect `postgresql`, outputs to `./drizzle`

**Scripts:** `db:generate`, `db:migrate`, `db:push`, `db:seed`, `db:studio`

### `@S-Loco/shared` (`packages/shared`)
Shared TypeScript utilities and Zod validators across all apps.

- `zod` `^3.24.0`
- **Exports:** `.`, `.constants`, `.validators`, `.validators/*`

---

## Build Tools & Task Runners

| Tool | Version | Role |
|---|---|---|
| Bun | `1.3.4` | Package manager + API runtime |
| Turbo | `^2.3.0` | Monorepo task orchestration |
| Biome | `^1.9.0` | Lint + format (`biome.json` root) |
| TypeScript | `^5.7.0` / `5.9.3` | Type checking (`tsc --noEmit`) |
| Next.js | `16.2.1` | Admin bundler (Turbopack in dev) |
| Expo | `55.0.8` | Mobile bundler/framework |
| Drizzle Kit | `0.31.10` | DB migrations/studio |
| pnpm | latest | Used in admin Docker build |
| PostCSS | via `@tailwindcss/postcss` | CSS processing for admin |

**Turbo tasks:** `dev`, `build`, `lint`, `check`, `db:generate`, `db:migrate`, `db:push`, `db:seed`, `db:studio`
**Build outputs:** `dist/**` and `.next/**` (tracked in `turbo.json`)

---

## Runtime Environments

| App | Runtime | Version |
|---|---|---|
| API | Bun | `1.2` (Docker) |
| Admin | Node.js | `22-alpine` (Docker) |
| Mobile | React Native (Expo) | `0.84.1` |
| Vendor | React Native (Expo) | `0.84.1` |

---

## Infrastructure

### Database & Cache
| Service | Image | Port | Config |
|---|---|---|---|
| PostgreSQL | `postgres:16-alpine` | `5432` | User/db: `sloco`/`sloco` |
| Redis | `redis:7-alpine` | `6379` | — |

Both defined in `docker-compose.yml` with healthchecks.

### Containerized Services
| Service | Dockerfile | Port |
|---|---|---|
| `@S-Loco/api` | `apps/api/Dockerfile` | `3000` |
| `@S-Loco/admin` | `apps/admin/Dockerfile` | `3001` |

---

## CI/CD

**File:** `.github/workflows/ci.yml`
**Triggers:** push to `master`/`main`, pull requests to `master`/`main`
**Runner:** `ubuntu-latest`

| Job | Depends on | Steps |
|---|---|---|
| `lint-and-typecheck` | — | `bun install`, `cd apps/api && bun run check`, `cd apps/admin && bun run check` |
| `test-api` | `lint-and-typecheck` | `bun install`, `cd apps/api && bun run test` |
| `build-api` | `test-api` | Docker build `apps/api/Dockerfile` |
| `build-admin` | `lint-and-typecheck` | Docker build `apps/admin/Dockerfile` |

Bun setup in CI: `oven-sh/setup-bun@v2` with `bun-version: latest`

---

## Environment Variables

See `.env.example` for full list. Key groups:

| Group | Variables |
|---|---|
| Database | `DATABASE_URL` |
| Cache | `REDIS_URL` |
| Auth | `JWT_SECRET`, `JWT_REFRESH_SECRET`, `QR_JWT_SECRET` |
| Payments | `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_URL`; `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_API_URL`; `SEPAY_API_KEY`, `SEPAY_SECRET_KEY` |
| AI | `GEMINI_API_KEY` |
| App | `APP_URL`, `PORT=3000`, `NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1` |

---

## Linter & Formatter

- **Biome** `^1.9.0` configured at root (`biome.json`)
- Single quotes, semicolons as-needed, trailing commas all, indent width 2, line width 100
- `recommended` preset; `noUnusedImports` + `noUnusedVariables` → warnings; `noNonNullAssertion` → off
- **Ignored:** `node_modules`, `dist`, `.next`, `.turbo`, `.expo`, `drizzle`, `bun.lockb`
- Run: `bun run lint` (check), `bun run format` (format --write)
