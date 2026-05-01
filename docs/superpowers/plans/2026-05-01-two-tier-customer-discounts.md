# Two-Tier Customer Discounts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add configurable app-funded customer discounts, expose two discount layers to tourist clients, and apply both layers to fixed-price orders and reservation vouchers.

**Architecture:** Add `vendors.app_discount_percent` as the configurable customer-funded-from-commission rate. Centralize price math in a small API pricing helper, then reuse it from discovery, service detail, order creation, and reservation confirmation so all flows compute the same vendor discount, app discount, final price, and platform margin. Keep existing fields in API/native models for compatibility and add optional normalized pricing decoding/rendering.

**Tech Stack:** Bun, TypeScript, Hono, Drizzle ORM/PostgreSQL, Zod, SwiftUI, Kotlin/Jetpack Compose.

---

## File Structure

- Create `packages/db/drizzle/migrations/0007_vendor_app_discount.sql`: add `app_discount_percent` and constraint.
- Modify `packages/db/drizzle/migrations/meta/_journal.json`: register migration `0007`.
- Modify `packages/db/src/schema/vendors.ts`: add `vendors.appDiscountPercent`.
- Modify `packages/shared/src/constants.ts`: name the default app customer discount.
- Modify `packages/shared/src/types.ts`: expose `Vendor.appDiscountPercent`.
- Modify `packages/shared/src/validators/vendor.ts`: validate `app_discount_percent <= commission_rate`.
- Create `apps/api/src/services/pricing.ts`: normalize service pricing and vendor commission split.
- Create `apps/api/tests/pricing.test.ts`: unit-test price math and validator behavior.
- Modify `apps/api/src/services/discovery.service.ts`: include normalized pricing in search results.
- Modify `apps/api/src/services/service.service.ts`: include normalized pricing in service detail.
- Modify `apps/api/src/services/order.service.ts`: charge final price after both discount layers and snapshot both layers.
- Modify `apps/api/src/services/reservation.service.ts`: use vendor app discount for reservation discount vouchers.
- Modify `apps/tourist-ios/SLocalTourist/Models.swift`, `APIClient.swift`, and `DashboardView.swift`: decode optional normalized pricing and render two discount labels.
- Modify `apps/tourist-android/app/src/main/java/com/slocal/tourist/MainActivity.kt`: parse optional normalized pricing and render two discount labels.

## Task 1: Database and Vendor Validation

**Files:**
- Create: `packages/db/drizzle/migrations/0007_vendor_app_discount.sql`
- Modify: `packages/db/drizzle/migrations/meta/_journal.json`
- Modify: `packages/db/src/schema/vendors.ts`
- Modify: `packages/shared/src/constants.ts`
- Modify: `packages/shared/src/types.ts`
- Modify: `packages/shared/src/validators/vendor.ts`
- Test: `apps/api/tests/pricing.test.ts`

- [ ] **Step 1: Write the failing validator test**

```ts
import { describe, expect, test } from 'bun:test'
import { adminUpdateVendorSchema, createVendorSchema } from '@S-Loco/shared/validators'

describe('vendor app discount validation', () => {
  test('defaults to allowing 5 percent app discount within 8 percent commission', () => {
    const parsed = createVendorSchema.parse({
      owner_id: '11111111-1111-4111-8111-111111111111',
      name: 'Vendor',
      slug: 'vendor',
    })
    expect(parsed.app_discount_percent).toBeUndefined()
  })

  test('rejects app discount greater than commission', () => {
    expect(() =>
      adminUpdateVendorSchema.parse({
        commission_rate: '3.00',
        app_discount_percent: '5.00',
      }),
    ).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/api/tests/pricing.test.ts --env-file=.env`
Expected: FAIL because `app_discount_percent` is not in the vendor schemas.

- [ ] **Step 3: Add schema, migration, constants, and validators**

Add migration:

```sql
ALTER TABLE vendors
  ADD COLUMN app_discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 5.00;

ALTER TABLE vendors
  ADD CONSTRAINT vendors_app_discount_lte_commission_chk
  CHECK (app_discount_percent >= 0 AND app_discount_percent <= commission_rate);
```

Add Drizzle column:

```ts
appDiscountPercent: decimal('app_discount_percent', { precision: 5, scale: 2 }).notNull().default('5.00'),
```

Add Zod field and refinement:

```ts
const percentString = z.string().regex(/^\d+(\.\d{1,2})?$/, 'Phần trăm không hợp lệ')

function appDiscountWithinCommission<T extends { commission_rate?: string; app_discount_percent?: string }>(data: T, ctx: z.RefinementCtx) {
  const commission = Number(data.commission_rate ?? '8.00')
  const appDiscount = Number(data.app_discount_percent ?? '5.00')
  if (appDiscount > commission) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['app_discount_percent'],
      message: 'Ưu đãi khách đặt qua app không được lớn hơn hoa hồng vendor.',
    })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/api/tests/pricing.test.ts --env-file=.env`
Expected: PASS.

## Task 2: Centralized Pricing Helper

**Files:**
- Create: `apps/api/src/services/pricing.ts`
- Modify: `apps/api/tests/pricing.test.ts`

- [ ] **Step 1: Write failing pricing tests**

```ts
import { calculateServicePricing } from '../src/services/pricing'

test('applies vendor discount then app discount and reports both layers', () => {
  const pricing = calculateServicePricing({
    originalPrice: '100000',
    discountPrice: '80000',
    discountPercent: '20.00',
    commissionRate: '8.00',
    appDiscountPercent: '5.00',
  })
  expect(pricing.vendor_price).toBe('80000')
  expect(pricing.final_price).toBe('76000')
  expect(pricing.vendor_discount_percent).toBe('20.00')
  expect(pricing.app_discount_percent).toBe('5.00')
  expect(pricing.platform_margin_percent).toBe('3.00')
  expect(pricing.display_discount_percent).toBe('24.00')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/api/tests/pricing.test.ts --env-file=.env`
Expected: FAIL because `calculateServicePricing` does not exist.

- [ ] **Step 3: Implement helper**

```ts
export type PricingInput = {
  originalPrice: string | number
  discountPrice?: string | number | null
  discountPercent?: string | number | null
  commissionRate?: string | number | null
  appDiscountPercent?: string | number | null
}

export type ServicePricing = {
  original_price: string
  vendor_price: string
  final_price: string
  vendor_discount_percent: string
  app_discount_percent: string
  display_discount_percent: string
  platform_margin_percent: string
}

export function calculateServicePricing(input: PricingInput): ServicePricing {
  const original = money(input.originalPrice)
  const vendorPrice = input.discountPrice ? money(input.discountPrice) : original
  const appDiscount = percent(input.appDiscountPercent, 5)
  const commission = percent(input.commissionRate, 8)
  const finalPrice = Math.round(vendorPrice * (1 - appDiscount / 100))
  const vendorDiscount = input.discountPercent
    ? percent(input.discountPercent, 0)
    : original > 0
      ? ((original - vendorPrice) / original) * 100
      : 0
  const displayDiscount = original > 0 ? ((original - finalPrice) / original) * 100 : 0
  return {
    original_price: String(original),
    vendor_price: String(vendorPrice),
    final_price: String(finalPrice),
    vendor_discount_percent: formatPercent(vendorDiscount),
    app_discount_percent: formatPercent(appDiscount),
    display_discount_percent: formatPercent(displayDiscount),
    platform_margin_percent: formatPercent(Math.max(commission - appDiscount, 0)),
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/api/tests/pricing.test.ts --env-file=.env`
Expected: PASS.

## Task 3: API Pricing Contract

**Files:**
- Modify: `apps/api/src/services/discovery.service.ts`
- Modify: `apps/api/src/services/service.service.ts`
- Test: `apps/api/tests/pricing.test.ts`

- [ ] **Step 1: Write failing response-shape unit test**

```ts
import { withServicePricing } from '../src/services/pricing'

test('attaches normalized pricing to service rows', () => {
  const row = withServicePricing({
    service: { originalPrice: '100000', discountPrice: '90000', discountPercent: '10.00' },
    vendor: { commissionRate: '8.00', appDiscountPercent: '5.00' },
  })
  expect(row.service.pricing.final_price).toBe('85500')
  expect(row.service.pricing.app_discount_percent).toBe('5.00')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test apps/api/tests/pricing.test.ts --env-file=.env`
Expected: FAIL because `withServicePricing` does not exist.

- [ ] **Step 3: Implement response attachment and call it from search/detail**

```ts
export function withServicePricing<T extends { service: any; vendor: any }>(row: T): T {
  return {
    ...row,
    service: {
      ...row.service,
      pricing: calculateServicePricing({
        originalPrice: row.service.originalPrice,
        discountPrice: row.service.discountPrice,
        discountPercent: row.service.discountPercent,
        commissionRate: row.vendor.commissionRate,
        appDiscountPercent: row.vendor.appDiscountPercent,
      }),
    },
  }
}
```

Map DB rows with `items.map(withServicePricing)` and return `withServicePricing(svc)` for detail.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test apps/api/tests/pricing.test.ts --env-file=.env`
Expected: PASS.

## Task 4: Orders and Reservations

**Files:**
- Modify: `apps/api/src/services/order.service.ts`
- Modify: `apps/api/src/services/reservation.service.ts`
- Test: `apps/api/tests/pricing.test.ts`

- [ ] **Step 1: Add failing unit coverage for order/reservation helper usage**

```ts
test('pricing helper exposes reservation app discount from vendor config', () => {
  const pricing = calculateServicePricing({
    originalPrice: '500000',
    commissionRate: '10.00',
    appDiscountPercent: '6.00',
  })
  expect(pricing.app_discount_percent).toBe('6.00')
  expect(pricing.platform_margin_percent).toBe('4.00')
})
```

- [ ] **Step 2: Run test to verify it fails or confirms helper gap**

Run: `bun test apps/api/tests/pricing.test.ts --env-file=.env`
Expected: FAIL until helper and service callers use vendor app discount.

- [ ] **Step 3: Update order and reservation callers**

Order service must select service joined to vendor, compute `calculateServicePricing`, use `final_price` as `unitPrice`, and snapshot the pricing object.

Reservation service must join vendor when loading a service and use `row.vendor.appDiscountPercent` for voucher `discountPercent`.

- [ ] **Step 4: Run tests and typecheck**

Run: `bun test apps/api/tests/pricing.test.ts --env-file=.env`
Expected: PASS.

Run: `bun run check`
Expected: PASS.

## Task 5: Native Tourist Display

**Files:**
- Modify: `apps/tourist-ios/SLocalTourist/Models.swift`
- Modify: `apps/tourist-ios/SLocalTourist/APIClient.swift`
- Modify: `apps/tourist-ios/SLocalTourist/DashboardView.swift`
- Modify: `apps/tourist-android/app/src/main/java/com/slocal/tourist/MainActivity.kt`

- [ ] **Step 1: Decode optional normalized pricing**

Add optional pricing models so old API responses still decode:

```swift
struct ServicePricingWire: Decodable {
    let finalPrice: String?
    let vendorDiscountPercent: String?
    let appDiscountPercent: String?
    enum CodingKeys: String, CodingKey {
        case finalPrice = "final_price"
        case vendorDiscountPercent = "vendor_discount_percent"
        case appDiscountPercent = "app_discount_percent"
    }
}
```

- [ ] **Step 2: Map final price and both labels**

Use `pricing.final_price` for `TouristService.price` when present. Keep fallback to `discountPrice`/`originalPrice`.

- [ ] **Step 3: Render two labels**

Render vendor promo and app promo as separate compact text chips on service cards/details when the corresponding percentages are greater than zero.

- [ ] **Step 4: Verify native compile where available**

Run: `bun run check`
Expected: PASS for TypeScript workspace. If Gradle/Xcode project build is unavailable in this workspace, report that native compile was not run.

## Final Verification

- [ ] Run `bun test apps/api/tests/pricing.test.ts --env-file=.env`.
- [ ] Run `bun run check`.
- [ ] Run `rg -n "app_discount_percent|appDiscountPercent|pricing" apps/api packages apps/tourist-ios apps/tourist-android` and inspect that all new contract fields are intentional.
- [ ] Review `git diff --stat` to ensure changes are scoped to discount pricing.
