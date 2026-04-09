# S-Loco Codebase Conventions

This document records the established conventions across the S-Loco monorepo. All citations refer to actual files or config values confirmed by inspection. If something is not listed here, it has not been codified.

---

## 1. Monorepo Structure

**Tool:** Turbo (v2.3.0) + Bun as package manager (bun@1.3.4, exact versions enforced via bunfig.toml).

```
s-local/
├── apps/
│   ├── admin/        # Next.js 16 (Pages Router) admin dashboard
│   ├── api/          # Hono REST API (Bun runtime)
│   ├── mobile/       # Expo/React Native tourist app
│   └── vendor/       # Expo/React Native vendor app
├── packages/
│   ├── db/           # Drizzle ORM schema + singleton client
│   └── shared/       # Zod validators, constants, types (no server deps)
├── docs/
├── biome.json
├── turbo.json
├── tsconfig.base.json
└── bunfig.toml
```

**Package naming:** All packages are workspace packages with workspace:* protocol. The monorepo package name is "S-Loco" (name: "S-Loco" in root package.json).

**Package exports discipline:** Shared types and validators are isolated in @S-Loco/shared and @S-Loco/db so they can be imported freely in both server and client packages without pulling in server-only dependencies.

---

## 2. Code Style & Formatting

### Biome (single tool for linting + formatting)

There is **no ESLint, no Prettier**. All style enforcement is via Biome (@biomejs/biome v1.9.0).

**Root config:** biome.json at repo root applies to all packages.

Key settings from biome.json:

```json
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
    }
  }
}
```

Notable rules applied:
- **`quoteStyle: "single"`** — single quotes for all JS/TS strings.
- **`semicolons: "asNeeded"`** — semicolons omitted where ASI applies.
- **`trailingCommas: "all"`** — trailing commas on all multi-line object/array literals.
- **`indentStyle: "space"`**, indent width 2 — do not use tabs.
- **`noUnusedImports: "warn"`**, **`noUnusedVariables: "warn"`** — unused bindings produce warnings, not errors.
- **`noNonNullAssertion: "off"`** — ! non-null assertions are allowed.
- **`organizeImports: true`** — imports are auto-sorted on save/format.

Ignored paths: node_modules, dist, .next, .turbo, .expo, drizzle, bun.lockb.

**Lint command:** bun run lint runs biome check . from root.

**Format command:** bun run format runs biome format --write . from root.

Each app may also run Biome on a subset of paths (e.g., lint: "biome check src/" in apps/api/package.json).

---

## 3. TypeScript Configuration

**Base config:** tsconfig.base.json at repo root.

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

Key implications:
- **`strict: true`** — all strict checks enabled; do not weaken.
- **`noUncheckedIndexedAccess: true`** — array/object index access returns T | undefined; handle both cases.
- **`noUnusedLocals: false`**, **`noUnusedParameters: false`** — Biome warnings are the enforcement mechanism, not the TypeScript compiler.
- **`moduleResolution: "bundler"`** — aligns with Bun/Vite module resolution.

---

## 4. Naming Conventions

### Files

| Context | Convention | Example |
|---------|-----------|---------|
| TypeScript source (services, routes, lib) | kebab-case.ts | auth.service.ts, otp.service.ts |
| Route files | kebab-case.ts | orders.ts, vouchers.ts |
| Schema files | kebab-case.ts | users.ts, orders.ts |
| Validator files | kebab-case.ts | auth.ts, payment.ts |
| Expo Router screens | kebab-case.tsx | app/(tabs)/search.tsx |
| Next.js pages | kebab-case.tsx | app/dashboard/vendors/page.tsx |
| Next.js layouts | _layout.tsx | app/dashboard/layout.tsx |

### Variables & Functions

- **camelCase** for variables and functions: generateAccessToken, userId, deviceInfo
- **PascalCase** for classes: AuthError, OtpError, TokenError, ApiError
- **Descriptive verb prefixes** for async service operations: verifyPassword, hashToken, sendOtp, verifyOtp, registerOrLoginWithOtp

### Database Schema Columns (Drizzle ORM)

Drizzle column names use **snake_case** SQL names aliased to **camelCase** TypeScript properties:

```ts
// packages/db/src/schema/users.ts
fullName: varchar("full_name", { length: 100 }),  // snake_case in DB, camelCase in TS
createdAt: timestamp("created_at", ...),
passwordHash: text("password_hash"),
isActive: boolean("is_active"),
```

Foreign keys follow the same: userId in TS -> user_id in DB.

### API Request/Response Fields

Zod input schemas use **snake_case keys** (matching the API wire format):

```ts
// packages/shared/src/validators/auth.ts
export const verifyOtpSchema = z.object({
  phone: z.string(),
  code: z.string(),
  full_name: z.string().optional(),     // snake_case wire format
  email: z.string().optional(),
  device_info: z.record(z.unknown()).optional(),
})
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
```

The service layer converts snake_case API inputs to camelCase DB columns manually.

### Constants

```ts
// packages/shared/src/constants.ts
export const USER_ROLES = ["tourist", "vendor_owner", "admin"] as const
export type UserRole = (typeof USER_ROLES)[number]

export const APP_CONSTANTS = {
  OTP_LENGTH: 4,
  OTP_EXPIRY_SECONDS: 300,
  ACCESS_TOKEN_TTL_SECONDS: 900,
  REFRESH_TOKEN_TTL_DAYS: 30,
} as const
```

---

## 5. Error Handling Patterns

### Custom Error Classes

All service-layer errors extend Error with a code: string property and a name override. Error classes are co-located with the service that throws them.

```ts
// apps/api/src/services/auth.service.ts
export class AuthError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = "AuthError"
  }
}
```

Existing error classes found:
- AuthError — authentication failures
- OtpError — OTP send/verify failures
- TokenError — JWT / refresh token failures
- ApiError — client-side HTTP errors (apps/admin/src/lib/api.ts)
- VendorError — vendor CRUD failures

### Error Propagation in Route Handlers

Route handlers catch known error types and return typed JSON responses, letting all other errors propagate to the global error handler:

```ts
// apps/api/src/routes/auth.ts
auth.post("/otp/verify", zValidator("json", verifyOtpSchema), async (c) => {
  try {
    const result = await registerOrLoginWithOtp(...)
    return c.json({ success: true, data: result })
  } catch (err) {
    if (err instanceof OtpError || err instanceof AuthError) {
      const status = err.code === "RATE_LIMITED" ? 429 : 400
      return c.json({ success: false, error: { code: err.code, message: err.message } }, status)
    }
    throw err  // re-throw unknown errors to global handler
  }
})
```

### Global Error Handler

```ts
// apps/api/src/index.ts
app.onError((err, c) => {
  console.error("[API Error]", err)
  return c.json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Lỗi hệ thống. Vui lòng thử lại." }
  }, 500)
})
```

### API Response Envelope

All API responses follow a consistent envelope:

```ts
// Success
{ success: true, data: <payload> }

// Error
{ success: false, error: { code: string, message: string } }
```

HTTP status codes carry semantic meaning (200, 400, 401, 403, 404, 429, 500) alongside the success: false body.

---

## 6. Type Conventions

### TypeScript Types

Types are inferred from Zod schemas via z.infer<typeof schema> in the shared package:

```ts
// packages/shared/src/validators/auth.ts
export type SendOtpInput = z.infer<typeof sendOtpSchema>
export type LoginInput = z.infer<typeof loginSchema>
```

DB types use Drizzle $inferSelect:

```ts
// apps/api/src/services/auth.service.ts
function sanitizeUser(user: typeof users.$inferSelect) {
  const { passwordHash, deletedAt, ...safe } = user
  return safe
}
```

### JSDoc

No JSDoc annotations are used in the codebase. Code is organized using **section divider comments** instead:

```ts
// ---- OTP Login (Tourist) ----------------------------------------
export async function registerOrLoginWithOtp(...) { ... }

// ---- Helpers --------------------------------------------------
function sanitizeUser(...) { ... }

// ---- Auth Error ----------------------------------------------
export class AuthError extends Error { ... }
```

Comments in the code are English; user-facing messages are Vietnamese.

### Zod for Runtime Validation

All API inputs are validated with Zod via @hono/zod-validator:

```ts
// apps/api/src/routes/auth.ts
import { zValidator } from "@hono/zod-validator"
import { loginSchema } from "@S-Loco/shared/validators"

auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json")  // typed + validated
})
```

---

## 7. Testing

### Framework

**Bun test** (bun:test) — not Vitest, Jest, or Mocha. Tests are in apps/api/tests/ and run with bun test tests/.

### Test File Pattern

Test files mirror the source structure under tests/:

```
apps/api/src/services/auth.service.ts
apps/api/tests/auth.test.ts
```

### Test Helpers

Centralized in apps/api/tests/helpers.ts:

```ts
// apps/api/tests/helpers.ts
export const testFetch = app.fetch  // exported fetch from the Hono app

export async function request(path, opts?) {
  // makes a request against the in-memory app.fetch, returns { status, data }
}

export async function adminLogin() { ... }   // returns admin JWT
export async function vendorLogin() { ... }  // returns vendor JWT
export function randomPhone() { ... }        // generates valid VN phone for OTP tests
```

### Test Style

Tests use describe/test/expect from bun:test. Inner describe groups sub-features.

```ts
// apps/api/tests/auth.test.ts
import { describe, expect, test } from "bun:test"
import { randomPhone, request } from "./helpers"

describe("Auth Flow", () => {
  describe("OTP", () => {
    test("POST /auth/otp/send - sends OTP to valid phone", async () => {
      const { status, data } = await request("/api/v1/auth/otp/send", {
        method: "POST",
        json: { phone: randomPhone() },
      })
      expect(status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})
```

Tests use the actual Hono app.fetch directly (no HTTP server startup), connected to the real database via getDb() from @S-Loco/db.

---

## 8. Documentation Standards

### Code Comments

Code blocks are organized using **padded divider comments** rather than JSDoc:

```ts
// ---- OTP Login (Tourist) ----------------------------------------
export async function registerOrLoginWithOtp(...) { ... }

// ---- Auth Error ----------------------------------------------
export class AuthError extends Error { ... }
```

### Architecture & Design Docs

Architecture documentation lives in docs/architecture/:
- api-design.md, database-design.md, deployment-guide.md
- monitoring-guide.md, security-design.md, system-architecture.md, tech-stack.md

Visual design system is documented in DESIGN.md at the repo root ("Coastal Editorial" theme).

### Inline User Messages

User-facing messages (errors, alerts, labels) are written in **Vietnamese**:
- API error messages: "Tài khoản đã bị vô hiệu hóa.", "Mã OTP không hợp lệ."
- UI labels in admin dashboard
- Vietnamese-specific patterns (phone regex: vnPhoneRegex = /^(0|\+84)\d{9,10}$/)

---

## 9. Git Conventions

### Commit Message Style

Conventional Commits (<type>: <description>), with scoped types:

| Type | Use for |
|------|---------|
| feat | New feature or user-facing capability |
| fix | Bug fix |
| docs | Documentation only |
| style | Formatting, design changes (no logic change) |
| chore | Tooling, deps, config, build, CI |
| refactor | Code restructure without behavior change |
| test | Test additions or corrections |
| infra | Infrastructure, Docker, CI/CD pipeline |

Scoped examples: feat(mobile):, fix(test):, docs:.

**Recent commits (all on master):**
```
feat: implement vendor management with commission config
docs: OpenAPI 3.1 spec + Scalar API docs at /docs
feat(mobile): connect all mobile + vendor screens to live API with OTP auth
infra: Docker, docker-compose, CI/CD pipeline, and env template
fix(test): correct voucher-state import in orders test
test(api): integration tests for auth, vendors, orders, vouchers, payments, settlements
feat(admin): connect all dashboard pages to live API via React Query
chore: rename brand S-Local -> S-Loco across all apps
feat(phase6): AI itinerary, combos, content hub, reviews - all 63 v1 requirements complete
feat(phase4): payment integration - VNPay, Momo, SePay gateways
feat(phase3): orders, vouchers, QR redemption - state machine, atomic redeem
```

### Branch Strategy

Only master branch is present. No explicit feature-branch or PR workflow is visible from the commit history.

---

## 10. Additional Conventions

### API Design

- **Framework:** Hono v4 (not Express, Fastify, or NestJS)
- **Versioning:** All v1 routes mounted under /api/v1 in apps/api/src/index.ts
- **OpenAPI:** docs/openapi.yaml — OpenAPI 3.1 spec; served at /openapi.yaml, rendered at /docs via Scalar
- **Schema validation:** @hono/zod-validator for all JSON body validation at the route layer
- **Auth:** Bearer JWT in Authorization header; middleware sets c.set("userId") and c.set("userRole")
- **CORS:** Allowlist: localhost:3001 (admin), localhost:3002 (vendor), localhost:8081 (mobile)

### Database

- **ORM:** Drizzle ORM (v0.38 in API, v0.45 in @S-Loco/db)
- **Config:** packages/db/drizzle.config.ts — output to ./drizzle, schema from ./src/schema, dialect postgresql
- **Schema files:** One file per domain: users.ts, orders.ts, vendors.ts, etc.
- **DB client:** Singleton via getDb() from @S-Loco/db

### Rate Limiting

Redis-backed sliding window rate limiting via ioredis. Configured instances:
- otpRateLimit: 5 req/min per phone
- apiRateLimit: 100 req/min per IP
- authRateLimit: 20 req/min per IP

Fail-open: if Redis is unavailable, requests pass through.

### Monorepo Dependency Management

- Inter-package dependencies use workspace:* protocol.
- bun.lock is committed; exact versions enforced (exact = true in bunfig.toml).
- trustedDependencies and ignoreScripts used for native module packages (e.g., sharp in apps/admin/package.json).

---

*Last reviewed against codebase: 2026-04-02. Update this document when new conventions are established.*
