# S-Loco Tech Stack — Verified 2026-04-03

> Sourced via Context7 MCP. All versions verified against official docs.

## Runtime

### Bun
- **Version:** Latest stable (`bun upgrade` to update)
- **Install:** `curl -fsSL https://bun.com/install | bash` / `powershell -c "irm bun.sh/install.ps1 | iex"` / `npm install -g bun`
- **Purpose:** All-in-one runtime, package manager, bundler, test runner
- **TypeScript:** Native support, no transpiler needed
- **Bun compatibility:** ✅ Full native support

---

## Backend Framework

### Hono
- **Version:** Latest (via `bun add hono`)
- **Install:** `npm create hono@latest` or `bun add hono`
- **Purpose:** Ultrafast API framework — works on Bun, Cloudflare Workers, Node.js
- **Bun adapter:** `import { serveStatic } from 'hono/bun'`
- **TypeScript:** ✅ Native
- **Key pattern:**
  ```ts
  import { Hono } from 'hono'
  import { serveStatic } from 'hono/bun'
  const app = new Hono()
  export default app
  ```

### Drizzle ORM
- **Version:** Latest (drizzle-kit_0.31.x as of Context7)
- **Install:** `bun add drizzle-orm` + `bun add -d drizzle-kit`
- **Purpose:** Type-safe SQL ORM for PostgreSQL
- **Bun driver:** `import { drizzle } from 'drizzle-orm/bun-sql'` (Bun v1.2+)
- **Bun compatibility:** ✅ `drizzle-orm/bun-sql` driver available
- **Caveats:** JSON/array types have Bun SQL driver limitations — use `postgres` driver for production:
  ```ts
  import { drizzle } from 'drizzle-orm/postgres-js'
  const db = drizzle(process.env.POSTGRES_URL!)
  ```
- **Migrations:** `npx drizzle-kit generate` / `npx drizzle-kit push`

### Zod
- **Version:** v3.24.x (latest v3 stable), v4.0.x available as stable
- **Install:** `bun add zod`
- **Purpose:** TypeScript-first schema validation
- **TypeScript:** ✅ Native, excellent inference
- **Key pattern:**
  ```ts
  import { z } from 'zod'
  const User = z.object({ name: z.string(), email: z.string().email() })
  type User = z.infer<typeof User>
  ```

### jose
- **Version:** Latest
- **Install:** `bun add jose`
- **Purpose:** JWT (JWS/JWE/JWT/JWK/JWKS) — zero-dependency, tree-shakeable
- **Runtimes:** Node.js, Bun, Deno, Cloudflare Workers, browser — all supported
- **TypeScript:** ✅ Native
- **Key pattern:**
  ```ts
  import * as jose from 'jose'
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
  const token = await new jose.SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt().setExpirationTime('7d')
    .sign(secret)
  const { payload } = await jose.jwtVerify(token, secret)
  ```

### BullMQ
- **Version:** Latest
- **Install:** `bun add bullmq`
- **Purpose:** Redis-based job queue (scheduling, retries, concurrency, priorities)
- **Runtime:** Node.js (Bun has limited Redis driver support — isolate in Node.js worker processes)
- **TypeScript:** ✅ Native
- **Key pattern:**
  ```ts
  import { Queue, Worker } from 'bullmq'
  const queue = new Queue('vouchers')
  await queue.add('send-email', { to: userId, voucherId })
  new Worker('vouchers', async job => { /* process */ }, { connection })
  ```

### Firebase Admin SDK
- **Version:** Latest (`firebase-admin`)
- **Install:** `bun add firebase-admin`
- **Purpose:** FCM push notifications, Auth, Firestore
- **Runtime:** Node.js 18+ only — **cannot run in Bun runtime**; use separate Node.js process or Cloud Functions
- **TypeScript:** ✅ Native
- **Key pattern:**
  ```ts
  import { getMessaging } from 'firebase-admin/messaging'
  await getMessaging().send({ token, notification: { title, body } })
  ```

### pino
- **Version:** v10.x (latest)
- **Install:** `bun add pino` + `bun add -d pino-pretty`
- **Purpose:** Structured JSON logging, fastest Node.js logger
- **Runtime:** Node.js / Bun (transports via worker threads)
- **TypeScript:** ✅ Native
- **Key pattern:**
  ```ts
  import pino from 'pino'
  const logger = pino({
    level: 'info',
    transport: { target: 'pino-pretty', options: { colorize: true } }
  })
  logger.info({ userId }, 'User logged in')
  ```

---

## Mobile (React Native + Expo)

### Expo SDK
- **Version:** Latest stable (SDK 54+ as of Context7)
- **Install:** `npx create-expo-app` / `npx expo install`
- **Purpose:** Universal native apps (iOS, Android, web) from React Native
- **Package management:** Always use `npx expo install` (not npm/yarn) — auto-resolves version compatibility with React Native
- **TypeScript:** ✅ Native (`tsconfig.json` included)

### @tanstack/react-query
- **Version:** v5.90.x (latest)
- **Install:** `bun add @tanstack/react-query @tanstack/react-query-devtools`
- **Purpose:** Server-state caching, background refetching, optimistic updates
- **React Native:** ✅ Works in Expo
- **TypeScript:** Requires TypeScript 4.7+ (TS 5.4+ recommended)
- **Key pattern:**
  ```ts
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
  const queryClient = new QueryClient()
  // Wrap app with QueryClientProvider
  const { data } = useQuery({ queryKey: ['vouchers'], queryFn: fetchVouchers })
  ```

### Zustand
- **Version:** v5.0.x (latest)
- **Install:** `bun add zustand`
- **Purpose:** Lightweight state management with hooks API
- **React Native:** ✅ Works in Expo
- **TypeScript:** Use `create<State>()` generic syntax
- **Key pattern:**
  ```ts
  import { create } from 'zustand'
  import { persist } from 'zustand/middleware'
  const useAuthStore = create<AuthState>()(
    persist((set) => ({
      user: null,
      login: (u) => set({ user: u }),
      logout: () => set({ user: null }),
    }), { name: 'auth-storage' })
  )
  ```

---

## Admin Dashboard

### Next.js 15
- **Version:** Latest stable (v16.x also in docs — use v15 LTS for stability)
- **Install:** `bun create next-app` or `bun add next@latest react@latest react-dom@latest`
- **Purpose:** Admin dashboard App Router, full-stack
- **TypeScript:** ✅ Native
- **Bun dev support:** Bun can run Next.js dev server (`bun --bun run next dev`)

### shadcn/ui
- **Version:** Latest (shadcn@3.x, shadcn@2.x also available)
- **Install:** `npx shadcn@latest init` then `npx shadcn@latest add <component>`
- **Purpose:** Copy-paste accessible components built on Radix UI + Tailwind CSS
- **Tailwind CSS:** v4 (installed by shadcn init)
- **TypeScript:** ✅ Native
- **Key pattern:**
  ```bash
  npx shadcn@latest init
  npx shadcn@latest add button dialog form select
  ```

### Tailwind CSS v4
- **Version:** v4 (bundled with shadcn/ui init)
- **Install:** Auto-installed by `npx shadcn@latest init`
- **Purpose:** Utility-first CSS, design token integration
- **TypeScript:** ✅ Native

### Biome
- **Version:** v1.9+ (v2.x also available)
- **Install:** `bun add -d @biomejs/biome`
- **Purpose:** Fast formatter + linter for TS/JS/JSX/JSON/CSS/GraphQL — replaces ESLint + Prettier
- **TypeScript:** ✅ Native
- **CI pattern:**
  ```bash
  biome format --write .
  biome lint --write .
  biome lint --write --unsafe .  # auto-fix
  ```

---

## Integration Patterns Verified

### Drizzle + Bun + PostgreSQL
- Dev: `drizzle-orm/bun-sql` — native Bun driver, no extra dependencies
- Production: `drizzle-orm/postgres-js` — avoids JSON/array limitations in Bun SQL driver
- Migrations: `drizzle-kit generate` / `push`

### Hono + Zod + JWT (jose)
- Validate request body: `z.parse(await c.req.json())` or via `@hono/zod-validator`
- JWT middleware: `jose.jwtVerify()` in a hook/middleware, attach `c.set('userId', payload.sub)`

### React Native + Expo + TanStack Query + Zustand
- Expo SDK 54+ — always use `npx expo install` for packages
- TanStack Query: server state (vouchers, user data, refetching)
- Zustand: client state (auth session, UI state, offline persistence)

### Next.js 15 + shadcn/ui + Tailwind v4
- `bun create next-app` scaffolds Next.js 15 + Tailwind v4 + TypeScript
- `npx shadcn@latest init` adds component library after setup
- Biome: lint/format in CI (ESLint still needed for Next.js specific rules)

### BullMQ + Firebase Admin — Bun Project Note
- Both require Node.js runtime — run in separate Node.js worker processes or Cloud Functions
- API server (Hono on Bun) enqueues BullMQ jobs via Redis
- FCM notifications dispatched from Node.js workers

---

## Peer Dependency Notes

| Library | Peer deps | Notes |
|---|---|---|
| Hono | None | Works everywhere |
| Drizzle ORM | `postgres-js` or `pg` | Use `postgres-js` for best Bun compat |
| Zod | None | Zero deps |
| jose | None | Zero deps, tree-shakeable |
| TanStack Query v5 | React 18+, TS 4.7+ | Use TS 5.4+ |
| Zustand v5 | React 18+ recommended | v5 needs React 18+ |
| Expo SDK 54 | React 18 | Use `npx expo install` |
| shadcn/ui | Tailwind CSS v4, Radix UI | Auto-resolved by CLI |
| BullMQ | `ioredis` | Not `bun:sqlite` |
| Firebase Admin | Node.js 18+ | **Not Bun-compatible** |
| pino | None | Transports need worker threads |
| Biome | None | Standalone binary or `npx` |

---

*Researched via Context7 MCP — 2026-04-03*
