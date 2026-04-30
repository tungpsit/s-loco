BEGIN;

CREATE TYPE service_fulfillment_type AS ENUM ('fixed_price', 'reservation');
CREATE TYPE reservation_status AS ENUM ('requested', 'confirmed', 'voucher_issued', 'used', 'settled', 'rejected', 'cancelled');
CREATE TYPE reservation_discount_voucher_status AS ENUM ('issuing', 'active', 'used', 'settled', 'issue_failed', 'cancelled');

ALTER TABLE services
  ADD COLUMN fulfillment_type service_fulfillment_type NOT NULL DEFAULT 'fixed_price',
  ADD COLUMN reservation_discount_percent NUMERIC(5, 2);

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  service_id UUID NOT NULL REFERENCES services(id),
  customer_name VARCHAR(200),
  customer_phone VARCHAR(20),
  party_size INTEGER NOT NULL,
  requested_time TIMESTAMPTZ NOT NULL,
  customer_note TEXT,
  status reservation_status NOT NULL DEFAULT 'requested',
  confirmed_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reservation_discount_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  user_id UUID NOT NULL REFERENCES users(id),
  discount_percent NUMERIC(5, 2) NOT NULL,
  ipos_voucher_code VARCHAR(100),
  ipos_voucher_id VARCHAR(255),
  status reservation_discount_voucher_status NOT NULL DEFAULT 'issuing',
  issue_attempt_count INTEGER NOT NULL DEFAULT 0,
  issue_error TEXT,
  raw_issue_response JSONB,
  used_at TIMESTAMPTZ,
  bill_amount NUMERIC(12, 2),
  discount_amount NUMERIC(12, 2),
  commission_amount NUMERIC(12, 2),
  ipos_transaction_id VARCHAR(255),
  raw_used_webhook JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ipos_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  idempotency_key VARCHAR(255) NOT NULL,
  reservation_voucher_id UUID REFERENCES reservation_discount_vouchers(id),
  ipos_voucher_code VARCHAR(100),
  ipos_transaction_id VARCHAR(255),
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX reservations_user_id_idx ON reservations(user_id);
CREATE INDEX reservations_vendor_id_idx ON reservations(vendor_id);
CREATE INDEX reservations_service_id_idx ON reservations(service_id);
CREATE INDEX reservations_status_idx ON reservations(status);
CREATE UNIQUE INDEX reservation_discount_vouchers_reservation_id_idx ON reservation_discount_vouchers(reservation_id);
CREATE UNIQUE INDEX reservation_discount_vouchers_ipos_code_idx ON reservation_discount_vouchers(ipos_voucher_code) WHERE ipos_voucher_code IS NOT NULL;
CREATE INDEX reservation_discount_vouchers_vendor_id_idx ON reservation_discount_vouchers(vendor_id);
CREATE INDEX reservation_discount_vouchers_status_idx ON reservation_discount_vouchers(status);
CREATE UNIQUE INDEX ipos_webhook_events_idempotency_key_idx ON ipos_webhook_events(idempotency_key);
CREATE INDEX ipos_webhook_events_voucher_id_idx ON ipos_webhook_events(reservation_voucher_id);

COMMIT;
