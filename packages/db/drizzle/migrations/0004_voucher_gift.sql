-- Migration: 0004_voucher_gift.sql
-- Add gift_token column to support voucher gifting via shareable link
BEGIN;

ALTER TABLE vouchers ADD COLUMN gift_token TEXT UNIQUE;

CREATE INDEX vouchers_gift_token_idx ON vouchers (gift_token)
  WHERE gift_token IS NOT NULL;

COMMIT;
