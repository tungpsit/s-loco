---
phase: 1
plan: 1
title: "Monorepo Scaffolding & Docker Infrastructure"
wave: 1
depends_on: []
files_modified:
  - package.json
  - turbo.json
  - bunfig.toml
  - docker-compose.yml
  - .env.example
  - apps/api/package.json
  - apps/api/src/index.ts
  - apps/mobile/package.json
  - apps/vendor/package.json
  - apps/admin/package.json
  - packages/db/package.json
  - packages/shared/package.json
  - .github/workflows/ci.yml
  - biome.json
  - tsconfig.base.json
autonomous: true
requirements_addressed: [FNDN-01, FNDN-03, FNDN-04]
must_haves:
  - Bun workspaces monorepo with all 4 apps + 2 packages
  - Docker Compose runs PostgreSQL 16, Redis 7, RustFS locally
  - CI pipeline runs lint + type check on all packages
---

# Plan 01: Monorepo Scaffolding & Docker Infrastructure

<objective>
Set up the Bun workspaces monorepo with Turborepo, scaffold all 4 apps (api, mobile, vendor, admin) and 2 packages (db, shared), configure Docker Compose for local development (PostgreSQL, Redis, RustFS), and establish CI pipeline with Biome linting.
</objective>

## Tasks

<task id="01-01" title="Initialize monorepo root with Bun workspaces + Turborepo">
<read_first>
- docs/architecture/tech-stack.md (§2.1 Monorepo structure)
- docs/architecture/system-architecture.md (§8 Monorepo Structure)
</read_first>
<action>
1. Create root `package.json` with workspaces config:
   ```json
   {
     "name": "s-local",
     "private": true,
     "workspaces": ["apps/*", "packages/*"],
     "scripts": {
       "dev": "turbo dev",
       "build": "turbo build",
       "lint": "turbo lint",
       "check": "turbo check",
       "db:migrate": "turbo db:migrate --filter=@s-local/db",
       "db:seed": "turbo db:seed --filter=@s-local/db"
     }
   }
   ```
2. Install devDependencies: `turbo`, `@biomejs/biome`, `typescript`
3. Create `turbo.json` with pipeline config for `dev`, `build`, `lint`, `check`, `db:migrate`, `db:seed`
4. Create `tsconfig.base.json` with shared compiler options (strict, ESNext, bundler module resolution, path aliases)
5. Create `biome.json` with formatter (2-space indent, single quotes) and linter rules
6. Create `bunfig.toml` with install lockfile config
7. Create `.gitignore` (node_modules, dist, .env, .turbo, drizzle/)
</action>
<acceptance_criteria>
- `package.json` contains `"workspaces": ["apps/*", "packages/*"]`
- `turbo.json` contains `"tasks"` with `"dev"`, `"build"`, `"lint"` keys
- `tsconfig.base.json` contains `"strict": true`
- `biome.json` exists and contains `"formatter"` key
- `bun install` exits 0 and creates `bun.lockb`
</acceptance_criteria>
</task>

<task id="01-02" title="Scaffold API app (Hono + Bun)">
<read_first>
- docs/architecture/tech-stack.md (§2.2 Backend)
- docs/architecture/api-design.md (§1 Conventions)
</read_first>
<action>
1. Create `apps/api/package.json` with name `@s-local/api`, dependencies: `hono`, `@hono/zod-openapi`, `@hono/zod-validator`, `zod`, `jose`, `@s-local/db`, `@s-local/shared`
2. Create `apps/api/tsconfig.json` extending base
3. Create `apps/api/src/index.ts` with basic Hono app:
   ```typescript
   import { Hono } from 'hono'
   import { cors } from 'hono/cors'
   import { logger } from 'hono/logger'
   
   const app = new Hono()
   app.use('*', logger())
   app.use('*', cors())
   app.get('/health', (c) => c.json({ status: 'ok', version: '1.0.0' }))
   
   export default { port: Number(process.env.PORT) || 3000, fetch: app.fetch }
   ```
4. Add dev script: `"dev": "bun run --hot src/index.ts"`
</action>
<acceptance_criteria>
- `apps/api/package.json` contains `"name": "@s-local/api"`
- `apps/api/package.json` contains `"hono"` in dependencies
- `apps/api/src/index.ts` contains `new Hono()`
- `apps/api/src/index.ts` contains `/health` route
- `bun run --cwd apps/api dev` starts without error
</acceptance_criteria>
</task>

<task id="01-03" title="Scaffold Mobile app (Expo)">
<read_first>
- docs/architecture/tech-stack.md (§2.1 Frontend Mobile)
</read_first>
<action>
1. Run `bunx create-expo-app@latest apps/mobile --template tabs` (or equivalent non-interactive command)
2. Update `apps/mobile/package.json` name to `@s-local/mobile`
3. Add dependencies: `@s-local/shared`, `zustand`, `@tanstack/react-query`
4. Create basic `app/(tabs)/index.tsx` with placeholder "S-Local Tourist" text
5. Ensure Expo Router file-based routing structure is in place
</action>
<acceptance_criteria>
- `apps/mobile/package.json` contains `"name": "@s-local/mobile"`
- `apps/mobile/package.json` contains `"expo"` in dependencies
- `apps/mobile/app` directory exists with route files
- `apps/mobile/package.json` contains `"zustand"` in dependencies
</acceptance_criteria>
</task>

<task id="01-04" title="Scaffold Vendor app (Expo)">
<read_first>
- docs/architecture/tech-stack.md (§2.1 Frontend Mobile)
</read_first>
<action>
1. Run `bunx create-expo-app@latest apps/vendor --template tabs`
2. Update `apps/vendor/package.json` name to `@s-local/vendor`
3. Add dependencies: `@s-local/shared`, `zustand`, `@tanstack/react-query`
4. Create basic `app/(tabs)/index.tsx` with placeholder "S-Local Vendor" text
</action>
<acceptance_criteria>
- `apps/vendor/package.json` contains `"name": "@s-local/vendor"`
- `apps/vendor/package.json` contains `"expo"` in dependencies
- `apps/vendor/app` directory exists
</acceptance_criteria>
</task>

<task id="01-05" title="Scaffold Admin dashboard (Next.js 15)">
<read_first>
- docs/architecture/tech-stack.md (§2.1 Frontend Admin)
</read_first>
<action>
1. Run `bunx create-next-app@latest apps/admin --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*"` (non-interactive)
2. Update `apps/admin/package.json` name to `@s-local/admin`
3. Add dependencies: `@s-local/shared`, `zustand`, `@tanstack/react-query`
4. Install shadcn/ui: `bunx shadcn@latest init` with default config
5. Create basic `app/(dashboard)/page.tsx` with "S-Local Admin" placeholder
</action>
<acceptance_criteria>
- `apps/admin/package.json` contains `"name": "@s-local/admin"`
- `apps/admin/package.json` contains `"next"` in dependencies
- `apps/admin/app` directory exists
- Tailwind CSS configured in `tailwind.config.ts` or equivalent
</acceptance_criteria>
</task>

<task id="01-06" title="Create shared packages (db + shared)">
<read_first>
- docs/architecture/tech-stack.md (§2.3 Shared Packages)
</read_first>
<action>
1. Create `packages/db/package.json` with name `@s-local/db`, dependencies: `drizzle-orm`, devDependencies: `drizzle-kit`
2. Create `packages/db/src/index.ts` with placeholder export
3. Create `packages/db/drizzle.config.ts` with PostgreSQL config pointing to `DATABASE_URL` env var
4. Create `packages/db/tsconfig.json` extending base
5. Create `packages/shared/package.json` with name `@s-local/shared`
6. Create `packages/shared/src/index.ts` with shared types (ApiResponse, ApiError, PaginatedResponse)
7. Create `packages/shared/src/constants.ts` with app constants (SERVICE_CATEGORIES enum, VOUCHER_STATUSES enum, USER_ROLES enum)
8. Create `packages/shared/tsconfig.json` extending base
</action>
<acceptance_criteria>
- `packages/db/package.json` contains `"name": "@s-local/db"`
- `packages/db/package.json` contains `"drizzle-orm"` in dependencies
- `packages/db/drizzle.config.ts` contains `dialect: 'postgresql'`
- `packages/shared/package.json` contains `"name": "@s-local/shared"`
- `packages/shared/src/constants.ts` contains `SERVICE_CATEGORIES`
- `bun install` succeeds from root with all workspace links
</acceptance_criteria>
</task>

<task id="01-07" title="Docker Compose for local development">
<read_first>
- docs/architecture/tech-stack.md (§2.5 Infrastructure)
- .planning/phases/01-foundation-auth/01-CONTEXT.md (Monorepo Bootstrap section)
</read_first>
<action>
1. Create `docker-compose.yml`:
   ```yaml
   version: '3.9'
   services:
     postgres:
       image: postgres:16-alpine
       ports: ["5432:5432"]
       environment:
         POSTGRES_USER: slocal
         POSTGRES_PASSWORD: slocal_dev
         POSTGRES_DB: slocal
       volumes: [postgres_data:/var/lib/postgresql/data]
       healthcheck:
         test: pg_isready -U slocal
         interval: 5s
         timeout: 3s
         retries: 5
     
     redis:
       image: redis:7-alpine
       ports: ["6379:6379"]
       volumes: [redis_data:/data]
       healthcheck:
         test: redis-cli ping
         interval: 5s
         timeout: 3s
         retries: 5
     
     rustfs:
       image: rustfs/rustfs:latest
       ports: ["9000:9000", "9001:9001"]
       environment:
         RUSTFS_ROOT_USER: slocal
         RUSTFS_ROOT_PASSWORD: slocal_dev
       volumes: [rustfs_data:/data]
       command: server /data --console-address ":9001"
   
   volumes:
     postgres_data:
     redis_data:
     rustfs_data:
   ```
2. Create `.env.example`:
   ```
   DATABASE_URL=postgresql://slocal:slocal_dev@localhost:5432/slocal
   REDIS_URL=redis://localhost:6379
   RUSTFS_ENDPOINT=http://localhost:9000
   RUSTFS_ACCESS_KEY=slocal
   RUSTFS_SECRET_KEY=slocal_dev
   JWT_SECRET=dev-secret-change-in-production
   JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
   PORT=3000
   ```
3. Create `.env` from `.env.example` (gitignored)
</action>
<acceptance_criteria>
- `docker-compose.yml` contains `postgres:16-alpine` service
- `docker-compose.yml` contains `redis:7-alpine` service
- `docker-compose.yml` contains `rustfs` service
- `.env.example` contains `DATABASE_URL=`
- `.env.example` contains `RUSTFS_ENDPOINT=`
- `docker compose up -d` starts all 3 services without error
</acceptance_criteria>
</task>

<task id="01-08" title="CI pipeline with GitHub Actions">
<read_first>
- docs/architecture/tech-stack.md (§2.8 Developer Experience)
</read_first>
<action>
1. Create `.github/workflows/ci.yml`:
   - Trigger on push/PR to main
   - Use `oven-sh/setup-bun@v2` for Bun
   - Steps: install deps, lint (biome check), type check (tsc --noEmit across workspaces), run tests
   - Services: PostgreSQL 16 for DB tests
2. Add root scripts: `"lint": "biome check ."`, `"check": "tsc --noEmit"`
</action>
<acceptance_criteria>
- `.github/workflows/ci.yml` exists
- CI file contains `oven-sh/setup-bun` action
- CI file contains `biome check` step
- CI file contains PostgreSQL service
</acceptance_criteria>
</task>

## Verification

```bash
# 1. Install dependencies
bun install

# 2. Start Docker services
docker compose up -d

# 3. Verify all services running
docker compose ps | grep -c "running"  # Should be 3

# 4. Verify workspace structure
ls apps/api apps/mobile apps/vendor apps/admin packages/db packages/shared

# 5. Run lint
bun run lint

# 6. Start API dev server
bun run --cwd apps/api dev &
curl localhost:3000/health  # Should return {"status":"ok"}
```
