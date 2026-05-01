# Two-Tier Customer Discounts Design

## Context

Tourist-facing service listings and details must show two distinct discount layers:

1. Vendor promotion: the product/service promotion configured by the vendor.
2. App booking promotion: an extra customer discount funded from the platform commission collected from the vendor.

The default business model is:

- Vendor commission: `8.00%`
- App-funded customer discount: `5.00%`
- Platform retained margin: `3.00%`

The app-funded customer discount must be configurable separately from commission, while defaulting to the current business model.

## Requirements

- Add a vendor-level `app_discount_percent` configuration with default `5.00`.
- Keep `commission_rate` as the vendor commission source of truth, default `8.00`.
- Treat platform margin as `commission_rate - app_discount_percent`.
- Validate `app_discount_percent >= 0`.
- Validate `app_discount_percent <= commission_rate`.
- Customer-facing service data must expose both vendor and app discount layers.
- Fixed-price orders must charge the final price after applying both layers.
- Reservation/table booking discounts must use the app-funded customer discount.
- Keep existing `reservation_discount_percent` data compatible, but do not treat it as the primary source for the app-funded booking discount.

## Pricing Model

For a fixed-price service:

```text
base_price = original_price
vendor_price = discount_price if present, else original_price
vendor_discount_percent = discount_percent if present, else derived from original_price and vendor_price
app_discount_percent = vendor.app_discount_percent
platform_margin_percent = max(vendor.commission_rate - vendor.app_discount_percent, 0)
final_price = vendor_price * (1 - app_discount_percent / 100)
display_discount_percent = combined effective discount from original_price to final_price
```

Rounding must produce integer VND amounts for customer display and order totals.

For a reservation service:

```text
reservation_app_discount_percent = vendor.app_discount_percent
platform_margin_percent = max(vendor.commission_rate - vendor.app_discount_percent, 0)
```

The reservation iPOS voucher must be issued for `reservation_app_discount_percent`.

## API Contract

Service search and detail responses must include a normalized pricing object alongside existing service fields:

```ts
pricing: {
  original_price: string
  vendor_price: string
  final_price: string
  vendor_discount_percent: string
  app_discount_percent: string
  display_discount_percent: string
  platform_margin_percent: string
}
```

Existing fields such as `originalPrice`, `discountPrice`, `discountPercent`, and `reservationDiscountPercent` remain in the response for native app compatibility during rollout.

## Order Behavior

Order creation must compute totals from normalized pricing:

- `totalAmount`: original price total before discounts.
- `discountAmount`: total discount from both vendor and app layers.
- `finalAmount`: customer payable total after both layers.
- `order_items.unitPrice`: final unit price charged to the customer.
- `serviceSnapshot`: include original price, vendor price, final price, vendor discount percent, app discount percent, display discount percent, and platform margin percent.

## Reservation Behavior

Reservation creation and confirmation must use `vendor.appDiscountPercent` as the customer discount for app bookings. Existing services without explicit reservation discount configuration remain eligible if the vendor has `app_discount_percent` configured.

The issued reservation discount voucher must store:

- `discountPercent = vendor.appDiscountPercent`
- Existing commission accounting remains based on vendor `commissionRate`.

## Native App Display

Tourist native apps must render two discount labels when present:

- Vendor promotion label, for example `KM vendor 15%`.
- App booking promotion label, for example `Đặt qua app giảm thêm 5%`.

For fixed-price services, show the final payable price after both layers. For reservations, show the app booking discount as the discount applied to the future bill.

## Testing

Add focused backend tests before implementation:

- Search/detail pricing returns both discount layers and final price.
- Order creation charges final price after both layers and snapshots both layers.
- Reservation confirmation issues voucher with vendor app discount.
- Validation rejects `app_discount_percent` greater than `commission_rate`.

Native rendering tests can be added if the existing native test setup already covers model decoding or view formatting. Otherwise, keep native changes limited to decoding optional pricing fields and rendering from existing data safely.
