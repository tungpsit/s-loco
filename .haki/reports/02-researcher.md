# 🔬 TECH RESEARCHER Report

**Agent:** Tech Researcher
**Phase:** 1
**Status:** 🟢 COMPLETED
**Started:** 2026-04-03T00:00:00Z
**Completed:** 2026-04-03T01:30:00Z

---

## Input

Libraries researched via Context7 MCP:
- Bun, Hono, Drizzle ORM, Zod, jose, @tanstack/react-query, Zustand
- Expo SDK, Next.js 15, shadcn/ui, Tailwind CSS v4, BullMQ, Firebase Admin SDK, pino, Biome

---

## Objectives

- [x] Verify all 14 libraries via Context7
- [x] Check Bun compatibility
- [x] Check TypeScript support
- [x] Verify integration patterns
- [x] Document install commands and key usage patterns
- [x] Save verified stack to `.haki/research/STACK.md`

---

## Research Summary

| # | Library | Verified Version | Install Command | Bun Compatible | TS | Notes |
|---|---|---|---|---|---|---|
| 1 | Bun | Latest stable | `bun upgrade` | ✅ Native | ✅ | Runtime + bundler + test runner |
| 2 | Hono | Latest | `bun add hono` | ✅ Native (`hono/bun`) | ✅ | Web standards, Bun adapter available |
| 3 | Drizzle ORM | 0.31.x (latest) | `bun add drizzle-orm drizzle-kit` | ⚠️ Partial | ✅ | Use `bun-sql` for dev, `postgres-js` for prod |
| 4 | Zod | v3.24.x / v4.0.x | `bun add zod` | ✅ | ✅ | Zero deps, excellent inference |
| 5 | jose | Latest | `bun add jose` | ✅ | ✅ | Zero deps, tree-shakeable, all runtimes |
| 6 | @tanstack/react-query | v5.90.x | `bun add @tanstack/react-query` | ✅ | ✅ | TS 4.7+, React 18+ |
| 7 | Zustand | v5.0.x | `bun add zustand` | ✅ | ✅ | `create<State>()` generic syntax |
| 8 | Expo SDK | SDK 54+ | `npx create-expo-app` | ✅ | ✅ | Always use `npx expo install` |
| 9 | Next.js 15 | Latest (v15 LTS) | `bun create next-app` | ⚠️ Dev only | ✅ | Production deploy uses Node.js |
| 10 | shadcn/ui | v3.x | `npx shadcn@latest init` | ✅ | ✅ | Tailwind v4 auto-resolved |
| 11 | Tailwind CSS | v4 | via shadcn init | ✅ | ✅ | Design token integration |
| 12 | BullMQ | Latest | `bun add bullmq` | ❌ Node.js | ✅ | Redis jobs, separate Node worker needed |
| 13 | Firebase Admin SDK | Latest | `bun add firebase-admin` | ❌ Node.js 18+ | ✅ | FCM only works in Node.js process |
| 14 | pino | v10.x | `bun add pino pino-pretty` | ⚠️ Partial | ✅ | Transports via worker threads |
| 15 | Biome | v1.9+ / v2.x | `bun add -d @biomejs/biome` | ✅ | ✅ | Replaces ESLint + Prettier |

---

## Key Findings

### ✅ Fully Bun-Native (can run directly)
Bun, Hono, Zod, jose, @tanstack/react-query, Zustand, Expo, shadcn/ui, Biome

### ⚠️ Bun-Compatible with Caveats
- **Drizzle ORM**: Use `bun-sql` driver in dev; `postgres-js` in production to avoid JSON/array limitations
- **Next.js 15**: Bun can run dev server; production deploys should use Node.js
- **pino**: Works but transports (pretty, file) need worker threads on Bun

### ❌ Node.js-Only (must isolate)
- **BullMQ**: Redis driver on Bun is immature — run in separate Node.js worker processes
- **Firebase Admin SDK**: Node.js 18+ runtime required — cannot run on Bun

### Recommended Pattern for Node.js-Only Libraries
```
Hono API (Bun) → Redis (BullMQ) → Node.js Worker → Firebase Admin (FCM)
```
API server on Bun enqueues jobs; Node.js workers process them and send FCM notifications.

---

## Integration Patterns Verified

### Drizzle + Bun + PostgreSQL
```ts
// Dev: native Bun driver
import { drizzle } from 'drizzle-orm/bun-sql'

// Prod: postgres-js driver (avoids Bun SQL limitations)
import { drizzle } from 'drizzle-orm/postgres-js'
const db = drizzle(process.env.POSTGRES_URL!)
```

### Hono + Zod + JWT (jose)
```ts
import { Hono } from 'hono'
import { z } from 'zod'
import * as jose from 'jose'

const app = new Hono()
const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

app.use('/api/*', async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { payload } = await jose.jwtVerify(token, secret)
    c.set('userId', payload.sub)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

app.post('/api/vouchers', async (c) => {
  const body = z.object({ title: z.string(), value: z.number() }).parse(await c.req.json())
  const userId = c.get('userId')
  // ...
})
```

### React Native + Expo + TanStack Query + Zustand
```ts
// Zustand: client state
const useAuthStore = create<AuthState>()(
  persist((set) => ({
    user: null,
    login: (u) => set({ user: u }),
    logout: () => set({ user: null }),
  }), { name: 'auth-storage' })
)

// TanStack Query: server state
const { data: vouchers } = useQuery({
  queryKey: ['vouchers', userId],
  queryFn: () => api.get(`/users/${userId}/vouchers`),
  staleTime: 1000 * 60 * 5,
})
```

### Next.js 15 + shadcn/ui + Tailwind v4
```bash
bun create next-app admin-dashboard
cd admin-dashboard
npx shadcn@latest init
npx shadcn@latest add button dialog form select table
bun add @biomejs/biome
biome init
```

---

## Output

- **File created:** `.haki/research/STACK.md` — full verified stack with install commands, usage patterns, caveats
- **Report:** `.haki/reports/02-researcher.md` — this file

---

## Handoff Notes

### → DB Engineer (Phase 2: Drizzle schema)
- Use `bun add drizzle-orm drizzle-kit` to install
- Use `drizzle-orm/postgres-js` (not `bun-sql`) for production schema work
- Schema definitions go in `packages/db/src/schema/`
- Migrations: `npx drizzle-kit generate` then `npx drizzle-kit push`
- Key: users, vouchers, locations, transactions, otp_codes tables

### → Backend Dev (Phase 3: Foundation & Auth)
- Hono + Zod + jose pattern is verified and ready to implement
- JWT secret: use `jose.algorithm === 'HS256'` + 7-day expiry
- BullMQ + Firebase Admin must run in Node.js — design API to enqueue to Redis, not call Firebase directly from Bun
- pino logger: `bun add pino pino-pretty`

### → Frontend Dev (Phase 3: App scaffolding)
- Expo: `npx create-expo-app` — SDK 54+ confirmed
- TanStack Query + Zustand: both verified, use `npx expo install` for all packages
- Admin: `bun create next-app` then `npx shadcn@latest init`

### → DevOps (Phase 5: CI/CD)
- Biome for lint/format: `bun add -d @biomejs/biome`
- BullMQ worker and Firebase Admin need Node.js base image (not Bun)
- Consider `node:18-alpine` or `node:20-alpine` for worker containers
