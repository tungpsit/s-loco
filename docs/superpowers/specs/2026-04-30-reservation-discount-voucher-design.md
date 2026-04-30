# Reservation Discount Voucher Design

Date: 2026-04-30

## Context

S-Loco currently supports services with known prices through a prepaid voucher flow:

```text
service with fixed price -> order -> payment -> paid voucher -> QR redemption -> completion -> settlement
```

Some vendor services, especially restaurants and cafes, do not have a known final price before the customer visits. For these services, S-Loco should support a reservation flow instead of forcing checkout with a guessed price.

The agreed MVP behavior is:

- Tourist does not pay S-Loco before the visit.
- Tourist submits a reservation request with basic details.
- Vendor contacts the tourist outside the system and confirms or rejects the request in the vendor app.
- After vendor confirmation, S-Loco creates a percentage discount voucher on the restaurant's iPos system.
- The iPos voucher code is sent to the tourist.
- Tourist gives the code to the cashier after using the service.
- iPos applies the discount and later calls a S-Loco webhook.
- S-Loco records usage and calculates commission from the actual bill amount when the iPos payload supports it.

## Decisions

- Use a separate `reservations` domain instead of reusing `orders` with zero amount.
- Keep the existing prepaid `orders`, `payments`, and `vouchers` flow unchanged.
- Require `service_id` for reservation requests. Customers reserve a specific reservation-type service.
- Use a fixed percentage discount for the MVP.
- Do not collect deposit or prepayment in the MVP.
- Do not add in-app chat or vendor counter-offers in the MVP.
- Vendor confirms or rejects after contacting the customer outside S-Loco.
- Reservation discount vouchers do not expire in the MVP.
- iPos is the source of truth for whether the discount voucher was used at the cashier.
- Store raw iPos responses and webhook payloads because the exact iPos payload shape is not confirmed yet.

## Domain Model

The new flow is named Reservation Discount Flow.

Prepaid voucher flow remains:

```text
CREATED -> PAID -> REDEEMED -> COMPLETED -> SETTLED
```

Reservation flow uses separate states:

```text
reservation:
requested -> confirmed -> voucher_issued -> used -> settled
requested -> rejected
confirmed/voucher_issued -> cancelled

reservation_discount_voucher:
issuing -> active -> used -> settled
issuing -> issue_failed
active -> cancelled
```

Rationale:

- `paid` is not correct because S-Loco does not collect money before the visit.
- `redeemed` is not correct because S-Loco does not scan or redeem the voucher; iPos does.
- `completed` is less useful than `used` here because usage is confirmed by the POS transaction.

## Data Model

Add `reservations`:

```text
id
user_id
vendor_id
service_id
customer_name
customer_phone
party_size
requested_time
customer_note
status
confirmed_at
rejected_at
cancelled_at
used_at
settled_at
created_at
updated_at
```

Add `reservation_discount_vouchers`:

```text
id
reservation_id
vendor_id
user_id
discount_percent
ipos_voucher_code
ipos_voucher_id nullable
status
issue_attempt_count
issue_error
raw_issue_response
used_at
bill_amount nullable
discount_amount nullable
commission_amount nullable
ipos_transaction_id nullable
raw_used_webhook
created_at
updated_at
```

Add `ipos_webhook_events`:

```text
id
event_type
idempotency_key
reservation_voucher_id nullable
ipos_voucher_code nullable
ipos_transaction_id nullable
payload
processed_at
processing_error
created_at
```

Data rules:

- `reservations.status` is the customer/vendor-facing state.
- `reservation_discount_vouchers.status` is the technical iPos voucher state.
- `discount_percent` is snapshotted when the voucher is issued so later service/vendor configuration changes do not affect existing reservations.
- `ipos_webhook_events` stores raw payload before processing.
- `commission_amount` is calculated only when bill amount can be mapped from iPos payload.
- If a webhook marks a voucher used but lacks bill amount, keep `commission_amount = null` and surface the record for admin reconciliation.

## API Design

Tourist:

```text
POST /reservations
GET /reservations
GET /reservations/:id
POST /reservations/:id/cancel
```

Vendor:

```text
GET /reservations/vendor?status=requested
POST /reservations/:id/confirm
POST /reservations/:id/reject
POST /reservation-discount-vouchers/:id/retry-issue
```

Admin:

```text
GET /admin/reservations
GET /admin/ipos-webhook-events
```

iPos:

```text
POST /webhooks/ipos
```

`POST /reservations` request fields:

```text
service_id
party_size
requested_time
customer_note optional
```

Customer name and phone should default from the tourist profile. The UI may display them for confirmation, but the MVP does not need alternate contact fields unless the existing profile data is missing.

## Main Flow

1. Tourist opens a reservation-type service and submits a reservation request.
2. Backend validates that the service is active and supports reservation.
3. Backend creates `reservation` with status `requested`.
4. Vendor receives a notification.
5. Vendor contacts the customer outside the system.
6. Vendor confirms or rejects in the vendor app.
7. On confirm, backend sets reservation `confirmed` and creates a `reservation_discount_voucher` with status `issuing`.
8. Backend calls iPos to create a percentage discount voucher.
9. If iPos succeeds, backend stores `ipos_voucher_code`, sets voucher `active`, sets reservation `voucher_issued`, and sends the code to the tourist.
10. If iPos fails, backend sets voucher `issue_failed`, keeps reservation `confirmed`, stores the error, and allows retry.
11. Tourist gives the code to the cashier after using the service.
12. iPos applies the discount and sends a webhook to S-Loco.
13. Backend stores the raw webhook event and processes it idempotently.
14. Backend finds the reservation voucher by iPos voucher id, voucher code, or transaction reference.
15. Backend sets voucher `used` and reservation `used`.
16. Backend calculates commission if bill amount is present.
17. Settlement later moves used reservation vouchers to `settled`.

## Error Handling

- Reject reservation creation if service is inactive, missing, or not reservation-enabled.
- Vendor can only confirm or reject reservations for their own vendor.
- Confirm is idempotent after voucher issuance and must not create a second iPos voucher.
- Reject is allowed only from `requested`.
- Tourist cancellation is allowed from `requested`; cancellation after vendor confirmation is out of MVP unless admin handles it manually.
- If iPos create-voucher times out or fails, do not generate a fake code. Store the failure and expose retry.
- iPos webhook processing must be idempotent by transaction id, iPos event id, or a deterministic fallback hash of the payload.
- If a webhook cannot be mapped to a voucher, keep the raw event with `processing_error` for admin review.
- If the webhook confirms usage but lacks bill amount, mark the voucher used and leave commission fields null for reconciliation.

## Product Behavior

Tourist app:

- Reservation-type service detail shows `Đặt chỗ` instead of checkout.
- Reservation form asks for party size, requested time, and optional note.
- Reservation detail initially shows `Chờ nhà hàng liên hệ`.
- After vendor rejection, the detail shows the rejected status.
- After iPos voucher issuance, the detail shows the voucher code and instructions to give it to the cashier.
- Reservation vouchers do not show S-Loco QR redemption.
- After iPos usage webhook, the reservation shows `Đã sử dụng` and can unlock review behavior similar to completed vouchers.

Vendor app:

- Add a reservation list or a clear reservation filter alongside current order management.
- Reservation cards show customer name, phone, party size, requested time, note, and service.
- Vendor can tap the phone number to contact the customer outside the app.
- Vendor can confirm or reject.
- If iPos issuance fails, show a short error and `Thử lại`.
- Vendor cannot manually mark reservation vouchers used; iPos webhook is the source of truth.

Admin:

- Admin can inspect reservations.
- Admin can inspect iPos webhook events, especially unmapped events and events with processing errors.
- Revenue reporting separates:
  - prepaid voucher revenue from S-Loco payments;
  - reservation discount revenue from iPos bill webhooks.

Notifications:

- Notify vendor when a new reservation is requested.
- Notify tourist when the reservation is confirmed or rejected.
- Notify tourist when the iPos voucher code is issued.
- Surface repeated iPos issue/webhook failures to admin operations.

## Testing Strategy

Backend tests:

- Tourist can create a reservation only for an active reservation-enabled service.
- Tourist cannot create reservation for fixed-price prepaid-only services.
- Vendor can list only their own reservation requests.
- Vendor confirm creates exactly one reservation discount voucher.
- Repeated confirm does not create another iPos voucher.
- Vendor reject only works from `requested`.
- iPos issue failure stores the error and allows retry.
- Successful retry activates the existing reservation voucher.
- iPos webhook is idempotent.
- iPos webhook maps voucher by supported identifiers.
- Unmapped webhook is stored with processing error.
- Webhook with bill amount calculates commission.
- Webhook without bill amount marks used but leaves commission null.
- Existing prepaid order/payment/voucher behavior remains unchanged.

UI tests:

- Reservation-type service shows reservation CTA, not checkout CTA.
- Tourist reservation detail shows waiting, issued-code, rejected, and used states.
- Vendor reservation list supports confirm, reject, and retry issue states.

## Out Of Scope

- Customer prepayment or deposit.
- In-app chat between tourist and vendor.
- Vendor-proposed alternate reservation times.
- Customer approval after vendor proposes changes.
- Reservation voucher expiry.
- Manual cashier redemption inside S-Loco.
- Full automatic iPos settlement if bill amount mapping is not available.
- Formal dispute management.

## Success Criteria

- Fixed-price prepaid services continue to use the existing order/payment/voucher flow.
- Reservation-type services do not require checkout or payment.
- Vendor confirmation creates an iPos percentage discount voucher.
- Tourist receives a usable iPos voucher code after successful issuance.
- S-Loco records iPos usage webhooks idempotently.
- S-Loco calculates commission from actual bill amount when available.
- Admin can inspect unmapped or incomplete iPos webhook events.
- Reservation revenue is reported separately from prepaid voucher revenue.
