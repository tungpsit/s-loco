# Pitfalls Research: Local Tourism Voucher Platform

## 1. Payment Webhook Reliability

**Risk:** Missed webhooks = vouchers stuck in CREATED state, tourist paid but didn't get voucher.

**Warning signs:**
- Vouchers in CREATED status for > 15 minutes
- Payment gateway retry exhaustion
- Signature verification failures in logs

**Prevention:**
- Implement idempotency key per payment (prevent double-processing)
- Store raw webhook payload before processing
- Polling fallback: periodic job checks payment status via gateway API
- Dead letter queue for failed webhook processing
- Dashboard alert for stale CREATED vouchers

**Phase:** Payment Integration (Phase 4)

## 2. Voucher State Machine Corruption

**Risk:** Race conditions allowing invalid state transitions (e.g., REDEEMED → PAID, double redeem).

**Warning signs:**
- Voucher audits showing impossible state jumps
- Customer complaints about "already used" vouchers they haven't used

**Prevention:**
- Application-level state machine with explicit transition guards
- Database-level CHECK constraint or trigger for valid transitions
- Optimistic locking (version column) on voucher updates
- Atomic operations: UPDATE vouchers SET status = 'REDEEMED' WHERE id = ? AND status = 'PAID'
- Comprehensive audit_log for all voucher transitions

**Phase:** Voucher System (Phase 3)

## 3. Settlement Calculation Errors

**Risk:** Incorrect commission calculation = vendor underpayment or platform revenue loss.

**Warning signs:**
- Vendor complaints about settlement amounts
- Mismatch between expected vs actual revenue

**Prevention:**
- Use DECIMAL(12,2) not FLOAT for all money columns
- Settlement calculation in DB transaction (read vouchers + create settlement atomically)
- Admin approval gate before disbursement (at least in v1)
- Reconciliation report: sum(voucher amounts) = sum(settlements) + sum(platform commission)

**Phase:** Settlement (Phase 5)

## 4. OTP Abuse & SMS Cost Explosion

**Risk:** Bots spamming OTP endpoint → huge SMS costs, rate limiting failures.

**Warning signs:**
- Sudden spike in OTP requests
- Same IP/fingerprint requesting many different phone numbers
- SMS provider cost alerts

**Prevention:**
- Rate limit: 5 OTP/minute/phone, 10/minute/IP
- Exponential backoff on resend (30s → 60s → 120s)
- CAPTCHA after 3rd attempt from same session
- IP-based blocking for suspicious patterns
- Budget alert on SMS provider dashboard
- Consider cheaper channels: Zalo OTP, WhatsApp OTP

**Phase:** Auth (Phase 1)

## 5. QR Token Security

**Risk:** QR token forgery → free service redemption without payment.

**Warning signs:**
- Redemptions without corresponding payments
- Pattern of redemptions from same vendor without orders

**Prevention:**
- QR token = signed JWT containing voucher_id + expiry
- Verify signature server-side on every redeem
- One-time use: token invalidated after redemption
- Short-lived display: regenerate QR token every 60 seconds
- Server validates voucher status = PAID before accepting redeem

**Phase:** Voucher/QR System (Phase 3)

## 6. Vendor App Adoption Friction

**Risk:** Vendors can't use the app → stuck vouchers, bad tourist experience.

**Warning signs:**
- High number of REDEEMED vouchers not moving to COMPLETED
- Vendor support tickets about QR scanning
- Low vendor app engagement metrics

**Prevention:**
- Auto-confirm timeout (24h after REDEEMED → COMPLETED if no disputes)
- Dead-simple vendor UI: one-tap confirm, large QR scanner
- Train vendors 1:1 during onboarding
- Provide fixed QR sticker for counter (tourist-scans-vendor mode)
- Fallback: admin can manually mark COMPLETED

**Phase:** Vendor App (Phase 6)

## 7. Bun Compatibility Issues

**Risk:** Some npm packages may have Bun-specific issues (native modules, Node.js APIs).

**Warning signs:**
- Runtime errors on packages that work in Node.js
- `node:*` API polyfill warnings

**Prevention:**
- Test critical dependencies early (BullMQ, jose, drizzle)
- Have Node.js fallback plan documented
- Pin Bun version in CI/CD
- Use `bunx` for one-off scripts, validate before committing

**Phase:** Setup (Phase 1)

## 8. Vietnamese Text Handling

**Risk:** Search and display issues with Vietnamese diacritics (tìm "sam son" should find "Sầm Sơn").

**Warning signs:**
- Users can't find vendors by name
- Sorting issues with Vietnamese characters

**Prevention:**
- PostgreSQL `unaccent` extension for search
- Normalize search input: strip diacritics, lowercase
- Store `slug` column (ASCII-only) for URL-safe identifiers
- Test with actual Vietnamese vendor names during development

**Phase:** Service Discovery (Phase 2)

---
*Researched: 2026-03-22*
