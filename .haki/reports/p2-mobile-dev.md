# 🎨 P2 Mobile Frontend Developer Report

## Tasks Implemented

### Task A: Payment Gateway Icons

**Files created:**
- `apps/mobile/src/components/payment-method-card.tsx` — reusable component
- `apps/mobile/src/app/checkout.tsx` — checkout screen
- `apps/mobile/src/app/service/[id].tsx` — service detail (entry point to checkout)
- `apps/mobile/src/lib/api.ts` — added `paymentsApi.initiate()` + updated types

**Component:** `PaymentMethodCard`
- Props: `gateway`, `selected`, `onSelect`
- Renders: icon emoji + label + subtitle + radio indicator
- Selected state: primary border (`#005E97`) + blue tint background
- Exports `PAYMENT_GATEWAYS` array with VNPay, MoMo, SePay

**Location in checkout:** `apps/mobile/src/app/checkout.tsx` — renders all three gateways via `PAYMENT_GATEWAYS.map()` with `selectedGateway` state. On selection → calls `paymentsApi.initiate(orderId, gatewayId)` → opens `payment_url` in browser via `Linking.openURL()`.

**Entry point:** `service/[id].tsx` — "Mua ngay" button creates order via `useCreateOrder()` then navigates to `/checkout?orderId={orderId}`.

### Task B: AI Itinerary Save/Share

**Files modified:**
- `apps/mobile/src/app/(tabs)/ai.tsx` — added save/share buttons + handlers
- `apps/mobile/src/lib/api.ts` — added `itineraryApi.save()`

**API added:**
```typescript
save: (data: ItineraryResult) =>
  request<{ id: string; share_token: string }>('/itinerary/save', {
    method: 'POST',
    json: { ...data },
  }),
```

**UX flow:**
1. After AI generates an itinerary, two buttons appear below the tips section: "💾 Lưu lịch trình" (primary, full-width) + "🔗 Chia sẻ" (secondary outline)
2. **Lưu:** calls `POST /itinerary/save` → shows alert with token → offers "Sao chép link" to copy `sloco://itinerary/{token}` to clipboard
3. **Chia sẻ:** if already saved → copies token link directly; if not → saves first then copies → shows "Đã sao chép!" confirmation
4. Both buttons disabled with spinner while `saving = true`
5. `savedToken` state persists across re-renders so repeated shares don't re-save
6. `reset()` clears `savedToken` on "← Tạo mới"

## Issues Found

- No checkout screen existed in the app — created `checkout.tsx` and `service/[id].tsx` as new screens. Deep-link routing from service cards (in `browse.tsx`, `index.tsx`) is wired via `router.push(\`/service/${item.id}\`)` which was already present.
- The `ItineraryResult` interface in `ai.tsx` had local re-declarations. The type is also exported from `lib/api.ts` — used the local declaration in `ai.tsx` to avoid import changes.
- `expo-clipboard` is not listed as an explicit dependency in the workspace — it may need to be added via `npx expo install expo-clipboard` before running.

## Recommendations

- Add `expo-clipboard` dependency: `npx expo install expo-clipboard` in `apps/mobile/`
- Wire up the deep-link `sloco://` scheme in `app.json`/`app.config.ts` to handle `sloco://itinerary/:token` redirects
- Payment confirmation: the current checkout flow opens the gateway URL externally. Consider adding a polling/wait screen to detect payment completion before redirecting to vouchers
- Add unit price display on the service detail quantity stepper (currently shows quantity only)
