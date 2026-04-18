# 🎁 P2 Voucher Gifting Developer Report

## Features Implemented

### Backend: gift.service.ts
- **giftByPhone**: Transfer voucher ownership by recipient phone number. Verifies sender owns voucher, voucher is PAID, then finds or creates recipient user, transfers ownership, generates new QR token, logs audit, sends notification.
- **createGiftLink**: Generates a UUID-based gift token stored on the voucher, returns `sloco://gift/{token}`. Reuses existing token if already generated.
- **claimGiftLink**: Recipient must be logged in. Verifies token exists and voucher still PAID, transfers ownership, clears gift token (one-time claim), logs audit.
- **storePendingClaim / checkAndClaimPendingGifts**: Redis-backed pending claim for logged-out users. Stored with 24h TTL and auto-claimed on login/register.
- **GiftError class**: Extends Error with `code: string`, following codebase conventions.

### New API Endpoints
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/vouchers/:id/gift/phone` | POST | tourist (owner) | Gift by phone |
| `/vouchers/:id/gift/link` | POST | tourist (owner) | Create shareable gift link |
| `/gifts/claim/:token` | POST | tourist (recipient) | Claim a gift link |

### Schema Changes
- Migration: `packages/db/drizzle/migrations/0004_voucher_gift.sql` — adds `gift_token TEXT UNIQUE` with partial index
- Schema: `packages/db/src/schema/orders.ts` — added `giftToken: text('gift_token').unique()` + index on vouchers table
- Validators: `packages/shared/src/validators/common.ts` — added `giftByPhoneSchema`

## Mobile: Gift Flow UI

### Modified Files
- `apps/mobile/src/app/(tabs)/vouchers.tsx` — Added "Tặng" button on each PAID voucher card, opens GiftModal
- `apps/mobile/src/app/(tabs)/vouchers.tsx` — Added GiftModal mount/unmount with `onSuccess={refetch}` to refresh list
- `apps/mobile/src/lib/api.ts` — Added `vouchersApi.giftByPhone`, `vouchersApi.createGiftLink`, `giftApi.claim`
- `apps/mobile/src/app/_layout.tsx` — Registered `gift/[token]` deep link route
- `apps/mobile/src/app/(auth)/otp-verify.tsx` — Auto-claims pending gift on login success

### New Screens / Components
- `apps/mobile/src/components/gift-modal.tsx` — Bottom-sheet modal with 2 tabs:
  - **Tab 1 "Gửi qua số điện thoại"**: Phone input + optional message + confirm button
  - **Tab 2 "Lấy link tặng"**: Creates gift link, shows link in copyable box, Copy and Share buttons
- `apps/mobile/src/app/gift/[token].tsx` — Deep link handler (`sloco://gift/{token}`). Shows loading → success/error state. If user not logged in, stores token in `global.__pendingGiftToken` and redirects to login.

### UX Flow
1. User taps "Tặng" button on any PAID voucher card
2. Modal opens with two tabs (phone / link)
3. **By phone**: Enter recipient phone + optional message → confirm → success alert → list refreshes
4. **By link**: Tap "Tạo link tặng" → link generated → Copy to clipboard or Share via native share sheet
5. **Claim flow**: Recipient taps `sloco://gift/{token}` link → if logged in: instant claim → success screen → redirect to vouchers. If not logged in: stored in `global.__pendingGiftToken`, redirected to login, auto-claimed on OTP success.

## Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `packages/db/drizzle/migrations/0004_voucher_gift.sql` | Created | Adds `gift_token` column + index |
| `packages/db/src/schema/orders.ts` | Modified | Added `giftToken` field + index on vouchers |
| `packages/shared/src/validators/common.ts` | Modified | Added `giftByPhoneSchema` |
| `apps/api/src/services/gift.service.ts` | Created | Core gift logic (phone, link, claim, pending) |
| `apps/api/src/routes/gifts.ts` | Created | `/gifts/claim/:token` route |
| `apps/api/src/routes/vouchers.ts` | Modified | Added gift by phone + gift link routes |
| `apps/api/src/index.ts` | Modified | Mounted `/gifts` route |
| `apps/mobile/src/lib/api.ts` | Modified | Added gift API methods |
| `apps/mobile/src/components/gift-modal.tsx` | Created | Gift modal with phone + link tabs |
| `apps/mobile/src/app/(tabs)/vouchers.tsx` | Modified | Added Tặng button + GiftModal |
| `apps/mobile/src/app/gift/[token].tsx` | Created | Deep link claim handler screen |
| `apps/mobile/src/app/_layout.tsx` | Modified | Registered `gift/[token]` route |
| `apps/mobile/src/app/(auth)/otp-verify.tsx` | Modified | Auto-claim pending gift on login |

## Issues Found

- **gift.service.ts**: Initial draft had `voucherId` variable name conflict in `claimGiftLink` — fixed to use `voucher.id`.
- **gift-modal.tsx**: Uses `expo-clipboard` for copy-to-clipboard — requires `nopde` to be installed in the mobile app. Expo SDK should include it by default; if not, install with `npx expo install expo-clipboard`.
- **GiftModal**: No explicit phone number validation (VN format). The API will return an error for invalid phones, but a UX improvement would be to add regex validation before submit.
- **gift/[token].tsx**: The `useGlobalSearchParams` approach for reading the token from deep links may conflict with Expo Router's file-based routing when the file is `gift/[token].tsx`. The token should be available as a route param via `useLocalSearchParams` in that screen component. The `useEffect` reads from `useGlobalSearchParams` as a fallback — may need adjustment after testing with actual deep link.

## Recommendations

- **Deep link config**: Add `sloco://gift` scheme to `app.json` / `app.config.ts` `extra.linkingscheme` or `scheme` field to enable `sloco://gift/{token}` URL handling in production.
- **One-time token**: After successful claim, `giftToken` is cleared from the voucher record. This prevents reuse but also means the sender loses track of the link. Consider storing the gift token history if tracking is needed.
- **Rate limiting**: Gift by phone is not currently rate-limited. Consider adding Redis-backed rate limit to prevent abuse (e.g., max 5 gifts/hour/user).
- **Push notification**: The `createNotification` call in gift.service.ts inserts to DB only. FCM push is handled by `fireAndForgetPush` in notification.service.ts — the `notifyGiftReceived` helper should be added there for consistency with other notification flows.
- **Test coverage**: Add integration tests in `apps/api/tests/gift.test.ts` covering happy path, self-gift rejection, invalid status, and expired voucher scenarios.
