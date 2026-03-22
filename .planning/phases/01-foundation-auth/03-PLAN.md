---
phase: 1
plan: 3
title: "Authentication System"
wave: 2
depends_on: [1, 2]
files_modified:
  - apps/api/src/routes/auth.ts
  - apps/api/src/services/auth.service.ts
  - apps/api/src/services/otp.service.ts
  - apps/api/src/services/token.service.ts
  - apps/api/src/middleware/auth.ts
  - apps/api/src/middleware/rate-limit.ts
  - apps/api/src/lib/password.ts
autonomous: true
requirements_addressed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06]
must_haves:
  - Tourist OTP login (send/verify → JWT)
  - Vendor/Admin email+password login
  - JWT access (15min) + refresh (30d) with rotation
  - Role-based middleware (tourist, vendor_owner, admin)
  - OTP rate limiting (5 req/min/phone)
---

# Plan 03: Authentication System

<objective>
Implement the complete authentication system: tourist OTP phone login, vendor/admin email+password login, JWT token management with refresh rotation, role-based access control middleware, and OTP rate limiting.
</objective>

## Tasks

<task id="03-01" title="OTP service (send/verify with console log in dev)">
<read_first>
- .planning/phases/01-foundation-auth/01-CONTEXT.md (OTP Delivery section)
- docs/architecture/api-design.md (§2.1.1 POST /auth/otp/send, §2.1.2 POST /auth/otp/verify)
- packages/db/src/schema/users.ts (otp_codes table)
</read_first>
<action>
1. Create `apps/api/src/services/otp.service.ts`:
   - `sendOtp(phone: string)`:
     - Rate check: count OTPs for phone in last minute, reject if >= 5
     - Generate 4-digit random code
     - Store in `otp_codes` table with 5-minute expiry
     - In dev (NODE_ENV=development): console.log the code with clear formatting:
       ```
       ╔════════════════════════════════════╗
       ║  OTP for 0912345678: 1234         ║
       ║  Expires in 5 minutes             ║
       ╚════════════════════════════════════╝
       ```
     - In production: call SMS provider interface (stub for now)
     - Return { success: true, expires_in: 300 }
   - `verifyOtp(phone: string, code: string)`:
     - Find latest non-expired, non-verified OTP for phone
     - Increment attempts, reject if attempts >= 5
     - Compare code, mark verified if match
     - Return { verified: true } or throw appropriate error
2. Create `apps/api/src/lib/sms-provider.ts` with SMSProvider interface:
   ```typescript
   export interface SMSProvider {
     send(phone: string, message: string): Promise<boolean>
   }
   export class ConsoleSMSProvider implements SMSProvider {
     async send(phone: string, message: string) {
       console.log(`[SMS] To: ${phone} | ${message}`)
       return true
     }
   }
   ```
</action>
<acceptance_criteria>
- `otp.service.ts` contains `sendOtp` function that generates 4-digit code
- `otp.service.ts` checks rate limit (5 per minute per phone)
- `otp.service.ts` stores OTP in `otp_codes` table
- `otp.service.ts` console.logs OTP in development mode
- `verifyOtp` increments attempts and rejects after 5
- `sms-provider.ts` exports `SMSProvider` interface
</acceptance_criteria>
</task>

<task id="03-02" title="Token service (JWT access + refresh with rotation)">
<read_first>
- docs/architecture/api-design.md (§1.2 Authentication — JWT, §2.1.3 POST /auth/refresh)
- packages/db/src/schema/users.ts (user_sessions table)
</read_first>
<action>
1. Create `apps/api/src/services/token.service.ts`:
   - Dependencies: `jose` for JWT signing/verification
   - `generateAccessToken(user: { id, role })`:
     - Sign JWT with HS256, payload: { sub: user.id, role: user.role }
     - TTL: 15 minutes
     - Secret from `JWT_SECRET` env var
   - `generateRefreshToken(userId: string, deviceInfo?: object, ipAddress?: string)`:
     - Generate random token string (crypto.randomUUID)
     - Hash with SHA-256 before storing
     - Insert into `user_sessions` table with 30-day expiry
     - Return the unhashed token to client
   - `refreshTokens(refreshToken: string)`:
     - Hash incoming token
     - Find session by hash, verify not expired
     - Delete old session (one-time use rotation)
     - Generate new access + refresh token pair
     - Return { access_token, refresh_token, expires_in: 900 }
   - `revokeSession(sessionId: string)`:
     - Delete from `user_sessions`
   - `revokeAllSessions(userId: string)`:
     - Delete all sessions for user
2. Token response format (per API design doc):
   ```json
   {
     "access_token": "eyJ...",
     "refresh_token": "uuid-string",
     "token_type": "Bearer",
     "expires_in": 900
   }
   ```
</action>
<acceptance_criteria>
- `token.service.ts` uses `jose` library for JWT
- Access token TTL is 900 seconds (15 minutes)
- Refresh token is stored as SHA-256 hash in `user_sessions`
- `refreshTokens` deletes old session before creating new (rotation)
- `revokeAllSessions` deletes all sessions for a user
</acceptance_criteria>
</task>

<task id="03-03" title="Password utilities">
<read_first>
- .planning/phases/01-foundation-auth/01-CONTEXT.md (Claude's Discretion — password hashing)
</read_first>
<action>
1. Create `apps/api/src/lib/password.ts`:
   - Use `Bun.password.hash()` and `Bun.password.verify()` (Bun native bcrypt)
   - `hashPassword(password: string)`: returns hashed string
   - `verifyPassword(password: string, hash: string)`: returns boolean
   - Configuration: bcrypt cost factor 12
</action>
<acceptance_criteria>
- `password.ts` uses `Bun.password.hash` with bcrypt algorithm
- `hashPassword` returns a string
- `verifyPassword` returns a boolean
</acceptance_criteria>
</task>

<task id="03-04" title="Auth service (login flows for all roles)">
<read_first>
- apps/api/src/services/otp.service.ts
- apps/api/src/services/token.service.ts
- apps/api/src/lib/password.ts
- docs/architecture/api-design.md (§2.1 Auth endpoints)
</read_first>
<action>
1. Create `apps/api/src/services/auth.service.ts`:
   - `registerOrLoginWithOtp(phone: string, code: string, profile?: { full_name, email }, deviceInfo?, ipAddress?)`:
     - Call `verifyOtp(phone, code)`
     - Find user by phone OR create new user with role 'tourist'
     - If new user and profile provided: set full_name, email
     - Generate access + refresh tokens
     - Return { user, tokens }
   - `loginWithEmail(email: string, password: string, deviceInfo?, ipAddress?)`:
     - Find user by email, verify is_active
     - Verify password hash
     - Check role is 'vendor_owner' or 'admin' (tourists can't use email login)
     - Generate access + refresh tokens
     - Return { user, tokens }
   - `logout(sessionId: string)`:
     - Revoke session
   - `getProfile(userId: string)`:
     - Return user data (exclude password_hash)
</action>
<acceptance_criteria>
- `auth.service.ts` contains `registerOrLoginWithOtp` function
- OTP login creates new user if phone not found
- `loginWithEmail` rejects tourist role
- `loginWithEmail` verifies password before generating tokens
- `logout` calls `revokeSession`
</acceptance_criteria>
</task>

<task id="03-05" title="Auth middleware (JWT verification + RBAC)">
<read_first>
- docs/architecture/api-design.md (§1.2 Authentication)
- apps/api/src/services/token.service.ts
</read_first>
<action>
1. Create `apps/api/src/middleware/auth.ts`:
   - `authMiddleware()`: Hono middleware that:
     - Extracts `Authorization: Bearer <token>` header
     - Verifies JWT signature and expiry using `jose`
     - Sets `c.set('userId', payload.sub)` and `c.set('userRole', payload.role)`
     - Returns 401 if missing/invalid/expired
   - `requireRole(...roles: string[])`: Hono middleware that:
     - Checks `c.get('userRole')` against allowed roles
     - Returns 403 if role not in list
   - `optionalAuth()`: Hono middleware that:
     - Same as authMiddleware but doesn't reject if no token (for guest browsing)
     - Sets userId/userRole if token present, null if not
2. Error responses follow API design:
   ```json
   { "success": false, "error": { "code": "UNAUTHORIZED", "message": "..." } }
   ```
</action>
<acceptance_criteria>
- `auth.ts` exports `authMiddleware`, `requireRole`, `optionalAuth`
- `authMiddleware` extracts Bearer token from Authorization header
- `authMiddleware` sets `userId` and `userRole` on context
- `requireRole` checks role and returns 403 if mismatched
- `optionalAuth` doesn't reject missing tokens
- Error responses match `{ success: false, error: { code, message } }` format
</acceptance_criteria>
</task>

<task id="03-06" title="Rate limiting middleware">
<read_first>
- docs/architecture/api-design.md (§1.7 Rate Limiting)
- .planning/phases/01-foundation-auth/01-CONTEXT.md (OTP rate limiting)
</read_first>
<action>
1. Create `apps/api/src/middleware/rate-limit.ts`:
   - Redis-based sliding window rate limiter
   - `rateLimiter(options: { windowMs, max, keyGenerator })`:
     - Default key: IP address
     - OTP-specific key: phone number
     - Returns 429 with `Retry-After` header
   - Pre-configured instances:
     - `otpRateLimit`: 5 requests per minute per phone
     - `apiRateLimit`: 100 requests per minute per IP
     - `authRateLimit`: 20 requests per minute per IP
</action>
<acceptance_criteria>
- `rate-limit.ts` implements sliding window with Redis
- `otpRateLimit` limits to 5 per minute per phone
- `apiRateLimit` limits to 100 per minute per IP
- Returns 429 status with `Retry-After` header
</acceptance_criteria>
</task>

<task id="03-07" title="Auth route handlers">
<read_first>
- apps/api/src/services/auth.service.ts
- apps/api/src/middleware/auth.ts
- apps/api/src/middleware/rate-limit.ts
- docs/architecture/api-design.md (§2.1 Auth endpoints — full spec)
- packages/shared/src/validators/auth.ts
</read_first>
<action>
1. Create `apps/api/src/routes/auth.ts`:
   - `POST /auth/otp/send` — validate phone, rate limit, send OTP
   - `POST /auth/otp/verify` — verify OTP, register/login, return tokens + user
   - `POST /auth/login` — email/password login for vendor/admin
   - `POST /auth/refresh` — refresh token rotation
   - `POST /auth/logout` — revoke session (requires auth)
   - `GET /auth/me` — get current user profile (requires auth)
2. Use `@hono/zod-validator` with schemas from `@s-local/shared`
3. Response format per API design doc:
   ```json
   {
     "success": true,
     "data": { "user": {...}, "tokens": {...} }
   }
   ```
4. Register routes in `apps/api/src/index.ts`: `app.route('/api/v1', authRoutes)`
</action>
<acceptance_criteria>
- `auth.ts` exports Hono router with 6 routes
- POST `/auth/otp/send` uses `sendOtpSchema` validator
- POST `/auth/otp/verify` uses `verifyOtpSchema` validator
- POST `/auth/login` uses `loginSchema` validator
- All responses match `{ success: true, data: {...} }` format
- Routes registered under `/api/v1` prefix in index.ts
</acceptance_criteria>
</task>

## Verification

```bash
# 1. Start services
docker compose up -d
bun run --cwd apps/api dev &

# 2. Test OTP send
curl -X POST http://localhost:3000/api/v1/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"0912345678"}'
# Check console for OTP code

# 3. Test OTP verify (use code from console)
curl -X POST http://localhost:3000/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone":"0912345678","code":"1234","full_name":"Test User","email":"test@example.com"}'
# Returns tokens

# 4. Test admin login (after seed)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@slocal.vn","password":"admin123"}'

# 5. Test auth middleware
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <access_token>"

# 6. Test rate limiting (send 6 OTPs rapidly)
for i in {1..6}; do curl -s -X POST http://localhost:3000/api/v1/auth/otp/send -H "Content-Type: application/json" -d '{"phone":"0912345678"}'; done
# 6th request should return 429
```
