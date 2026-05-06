-- Migration: 0013_notifications_data.sql
-- Add structured payload metadata for in-app notifications.

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS data JSONB;
