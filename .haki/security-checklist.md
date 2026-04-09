# 🔒 S-Loco Security Checklist

**Phase:** 4 — QA & Security Engineer
**Updated:** 2026-04-03

---

## Authentication Security

| Control | Target | Implemented | File | Status |
|---------|--------|-------------|------|--------|
| JWT access token TTL | 15 min | 900s | `packages/shared/src/constants.ts` | ✅ |
| JWT refresh token TTL | 30 days | 30 days | `packages/shared/src/constants.ts` | ✅ |
| Refresh token rotation | One-time use | Deletes old session before issuing new | `token.service.ts:78` | ✅ |
| Refresh token server-side storage | Hash in DB | `user_sessions` table with SHA-256 hash | `token.service.ts:26–53` | ✅ |
| bcrypt rounds | 10+ | **12** | `password.ts:2` | ✅ |
| OTP length | 4 digits | 4 digits | `otp.service.ts:25` | ✅ |
| OTP TTL | 5 min | 300s | `otp.service.ts:26` | ✅ |
| OTP rate limit | 5 req/min | 5 req/min per phone | `otp.service.ts:20` | ✅ |
| OTP max attempts | 5 | 5 attempts then requires resend | `otp.service.ts:74` | ✅ |
| RBAC middleware | All protected routes | `requireRole()` on admin/vendor routes | `middleware/auth.ts` | ✅ |
| JWT secret | min 32 chars, env-only | **Falls back to `'dev-secret'`** | `token.service.ts:7` | 🔴 RISK |
| Login attempt rate limit | 10 req/min/IP | Per-IP on login endpoint | `middleware/rate-limit.ts` | ✅ |

## Input Validation

| Control | Implemented | File | Status |
|---------|-------------|------|--------|
| All endpoints Zod-validated | Yes | All route files via `@hono/zod-validator` | ✅ |
| SQL injection prevented | Yes | Drizzle ORM parameterized queries | ✅ |
| XSS on rich text (articles) | Not verified | — | ⚠️ TODO Phase 6 |
| Phone number format | Zod regex | `packages/shared/src/validators/auth.ts` | ✅ |
| Email format | Zod email() | `packages/shared/src/validators/auth.ts` | ✅ |

## Payment Security

| Control | Implemented | File | Status |
|---------|-------------|------|--------|
| VNPay SHA512 HMAC signature | Yes | `gateways/vnpay.ts:41–58` | ✅ |
| Momo HMAC-SHA256 webhook | Yes | `gateways/momo.ts` | ✅ |
| SePay webhook signature | Yes | `gateways/sepay.ts` | ✅ |
| Payment idempotency | Yes | `payment_events` table unique constraint | ✅ |
| VNPay secret from env | Falls back to `'demo_secret'` | `gateways/vnpay.ts:5` | ⚠️ RISK |
| Momo secret from env | Falls back to `'demo_secret'` | `gateways/momo.ts` | ⚠️ RISK |
| SePay secret from env | Falls back to `'demo_secret'` | `gateways/sepay.ts` | ⚠️ RISK |

## Data Protection

| Control | Implemented | File | Status |
|---------|-------------|------|--------|
| Passwords hashed bcrypt | Yes, cost 12 | `password.ts:2` | ✅ |
| JWT contains no PII | `{ sub, role }` only | `token.service.ts:12` | ✅ |
| QR tokens: no PII | `voucher_id` + `code` only | `qr.service.ts` | ✅ |
| Refresh token hashed | SHA-256 | `token.service.ts:26` | ✅ |
| PII in logs | Not scanned | — | ⚠️ TODO |
| Sensitive env vars | JWT_SECRET must be set | `token.service.ts:7` | 🔴 RISK |

## API Security

| Control | Implemented | File | Status |
|---------|-------------|------|--------|
| CORS allowlist | Yes | `index.ts:26` | ✅ |
| CORS origins from env | No — hardcoded | `index.ts:26` | ⚠️ RISK |
| Global rate limit | 100 req/min | `middleware/rate-limit.ts` | ✅ |
| OTP endpoint per-IP limit | **Not implemented** | `otp.service.ts` | ⚠️ RISK |
| Helmet/security headers | Via Hono middleware | `index.ts` | ✅ |
| No stack traces in API errors | Global error handler | `index.ts:72–78` | ✅ |
| Request ID correlation | Via `X-Request-ID` | All routes | ✅ |

## Infrastructure Security

| Control | Target | Status |
|---------|--------|--------|
| PostgreSQL credentials | Env vars, rotated | ⚠️ TODO DevOps |
| Redis credentials | Env vars, no auth in dev | ⚠️ TODO DevOps |
| Secrets rotation | 90-day policy | ⚠️ TODO DevOps |
| HTTPS only (production) | TLS termination at load balancer | ⚠️ TODO DevOps |
| Database backup | Daily encrypted snapshots | ⚠️ TODO DevOps |
| Dependency CVE scanning | CI pipeline | ⚠️ TODO DevOps |

---

## Risk Register

| ID | Severity | Description | Location | Fix Owner | Status |
|----|----------|-------------|----------|-----------|--------|
| CR-01 | 🔴 CRITICAL | JWT secret fallback `'dev-secret'` | `token.service.ts:7` | Backend | Open |
| MED-01 | 🟡 Medium | CORS origins hardcoded | `index.ts:26` | Backend | Open |
| MED-02 | 🟡 Medium | Payment gateway secrets have dev fallbacks | `gateways/*.ts` | Backend | Open |
| MED-03 | 🟡 Medium | No per-IP rate limit on OTP endpoint | `otp.service.ts` | Backend | Open |
| MED-04 | 🟡 Medium | PII not scanned in logs | Pino logger | Backend | Open |
| LOW-01 | 🟢 Low | postgres-js is v0.1.0 preview | `package.json` | DevOps | Monitor |
