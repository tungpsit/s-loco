# Payment and Voucher Policy Design

Date: 2026-04-30

## Context

S-Loco uses a Voucher Pre-pay & Hold model: tourists pay on the platform, receive an electronic voucher, redeem it at a vendor through QR, and vendors are paid after service completion.

The current documents and implementation are not fully aligned:

- `docs/overview.md` says vouchers do not expire.
- The PRD, schema, and services currently model voucher expiry with `expiresAt` and `expired`.
- Mobile checkout lets tourists choose a payment gateway, but the current checkout flow creates an order without initiating real payment.
- Settlement currently risks marking vouchers as settled before actual disbursement.

This design standardizes the MVP policy while keeping the scope narrow.

## Decisions

- Vouchers do not expire as a right to use the purchased service.
- QR tokens expire and can be refreshed while the voucher remains valid.
- Refunds are available only for unused `PAID` vouchers.
- Refunds within 30 days from successful payment return to the original payment method, minus gateway fees if applicable.
- Refunds after 30 days are issued as S-Loco credit.
- A voucher becomes eligible for settlement only after `COMPLETED`.
- Vendor confirmation is the primary completion path. If the vendor forgets, the system auto-completes after 24 hours from `redeemedAt`.
- MVP does not add a formal dispute state. Customer support and admin handle disputes outside the voucher state machine.

## Recommended MVP Flow

1. Tourist checks out and creates an `Order` with status `CREATED`.
2. The system creates associated vouchers with status `CREATED`. These vouchers are not usable yet.
3. The app calls `POST /payments/initiate` with the selected gateway.
4. The payment gateway returns a payment URL or QR payment payload.
5. A verified gateway webhook marks the `Payment` as `success`, the `Order` as `paid`, and vouchers as `paid`.
6. When the tourist opens a `PAID` voucher, the app receives or refreshes a short-lived QR token.
7. Vendor scans the tourist QR, or the tourist scans the vendor QR.
8. The server verifies token signature, token expiry, voucher ownership, vendor match, and voucher status.
9. The server atomically transitions `PAID -> REDEEMED`.
10. Vendor confirms service completion with `REDEEMED -> COMPLETED`.
11. If the vendor does not confirm within 24 hours, an auto-complete job transitions eligible vouchers to `COMPLETED`.
12. Settlement batch jobs include only `COMPLETED` vouchers.
13. Vouchers transition to `SETTLED` only after successful disbursement, not when a pending settlement batch is created.

## Voucher State Model

MVP state transitions:

```text
CREATED -> PAID -> REDEEMED -> COMPLETED -> SETTLED
CREATED -> CANCELLED
PAID -> REFUNDED
```

Notes:

- `EXPIRED` should not be part of the MVP voucher usage flow because vouchers do not expire.
- If the enum keeps `expired` for future compatibility, application logic must not auto-expire vouchers by age.
- QR token expiry is separate from voucher validity.
- `TRANSFERRED` can stay out of the state machine if gifting is modeled as ownership transfer while status remains `PAID`.

## Data Changes

Keep the data model minimal:

- Stop using `vouchers.expiresAt` as voucher validity.
- Add QR-specific expiry data, for example `qrTokenExpiresAt`, or treat QR token expiry as encoded in the signed token and avoid persisting it unless needed for observability.
- Use `payments.paidAt` or order paid timestamp to calculate the 30-day original-method refund window.
- Add a small credit ledger for post-30-day refunds and later checkout use:

```text
credit_ledger
- id
- user_id
- amount
- direction: credit | debit
- source_voucher_id
- source_order_id
- reason
- created_at
```

The ledger is intentionally small. It supports issuing refund credit and consuming that credit on a later checkout without requiring a full wallet system in the MVP.

## API Changes

### Checkout and Payment

- `POST /orders` creates order and vouchers only.
- `POST /payments/initiate` starts payment with the selected gateway.
- Gateway webhooks remain the only trusted activation path for real payments.
- Webhook processing must be idempotent.
- Checkout may apply available S-Loco credit before gateway payment. The gateway amount is the remaining payable total.

### QR

- Add `POST /vouchers/:id/qr/refresh`.
- Only the voucher owner can refresh a QR token.
- Refresh requires voucher status `PAID`.
- QR tokens should be short-lived. A 15-minute to 1-hour TTL is acceptable for MVP.

### Refund

- `POST /vouchers/:id/refund` should choose refund method by policy:
  - `PAID` and payment age <= 30 days: gateway refund.
  - `PAID` and payment age > 30 days: create S-Loco credit.
  - Any other status: reject.

### Settlement

- Creating a pending settlement batch must not mark vouchers as `SETTLED`.
- `COMPLETED -> SETTLED` happens only after admin approval and successful disbursement.

## Product Behavior

### Tourist Checkout

- The payment gateway selector must affect the payment initiation request.
- After order creation, checkout should initiate payment and route to the gateway/payment instructions.
- If the user has S-Loco credit, checkout can apply it to reduce the gateway payment amount.
- The order detail screen should clearly show `CREATED` as unpaid and not yet usable.

### Tourist Voucher Detail

- `PAID` vouchers show QR.
- If the current QR token has expired, the app refreshes it before display or when the user taps refresh.
- Voucher detail should not show a service expiry date.
- Refund action is visible only for `PAID` vouchers.
- Refund copy should explain whether the outcome is original payment method or S-Loco credit.

### Vendor Flow

- Vendor can redeem only `PAID` vouchers.
- Vendor can complete only `REDEEMED` vouchers.
- Vendor earnings include vouchers after `COMPLETED`, but payout status should distinguish pending settlement from disbursed settlement.

## Testing Strategy

Add focused tests for the policy:

- Creating an order does not activate vouchers.
- A valid payment webhook activates order and vouchers.
- Duplicate webhook delivery does not activate or credit twice.
- Expired QR token is rejected.
- Refreshed QR token can redeem a still-valid voucher.
- Voucher older than 30 days can still be redeemed.
- `PAID` voucher refund within 30 days calls gateway refund.
- `PAID` voucher refund after 30 days creates credit.
- S-Loco credit can be applied once to a later checkout and cannot be double-spent.
- `REDEEMED`, `COMPLETED`, and `SETTLED` vouchers cannot be refunded.
- Settlement batch creation does not mark vouchers `SETTLED`.
- Successful disbursement marks included vouchers `SETTLED`.

## Out Of Scope

- Formal dispute case state.
- Full wallet features such as top-up, withdrawal, transfer, promotions, or expiring credit.
- Vendor-specific refund policies.
- Service-type-specific voucher expiry.
- Multi-step admin case management.

## Success Criteria

- Documentation, schema, API, and mobile behavior agree that vouchers do not expire.
- QR security is maintained through short-lived refreshable tokens.
- Payment gateway selection in checkout controls actual payment initiation.
- Refund behavior is predictable and auditable.
- Vendor payout occurs only after completion and successful disbursement.
