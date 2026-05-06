-- Migration: 0014_notification_category_severity.sql
-- Add operational filters for admin notifications.

DO $$ BEGIN
  CREATE TYPE notification_category AS ENUM (
    'order',
    'vendor',
    'settlement',
    'payment',
    'refund',
    'content',
    'system'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_severity AS ENUM (
    'info',
    'success',
    'warning',
    'critical'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS category notification_category NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS severity notification_severity NOT NULL DEFAULT 'info';

CREATE INDEX IF NOT EXISTS notifications_category_idx ON notifications (user_id, category);
CREATE INDEX IF NOT EXISTS notifications_severity_idx ON notifications (user_id, severity);
