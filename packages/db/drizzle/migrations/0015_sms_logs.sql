CREATE TYPE "public"."sms_log_status" AS ENUM('pending', 'accepted', 'failed', 'delivered', 'undelivered', 'unknown');

CREATE TABLE "sms_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider" varchar(50) NOT NULL,
  "purpose" varchar(50) DEFAULT 'otp' NOT NULL,
  "phone" varchar(32) NOT NULL,
  "content" text NOT NULL,
  "request_id" varchar(50),
  "sms_id" varchar(100),
  "status" "sms_log_status" DEFAULT 'pending' NOT NULL,
  "code_result" varchar(20),
  "error_message" text,
  "send_status" varchar(50),
  "request_payload" jsonb,
  "response_payload" jsonb,
  "callback_payload" jsonb,
  "sent_at" timestamp with time zone,
  "callback_received_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "sms_logs_provider_idx" ON "sms_logs" USING btree ("provider");
CREATE INDEX "sms_logs_phone_idx" ON "sms_logs" USING btree ("phone");
CREATE INDEX "sms_logs_request_id_idx" ON "sms_logs" USING btree ("request_id");
CREATE INDEX "sms_logs_sms_id_idx" ON "sms_logs" USING btree ("sms_id");
CREATE INDEX "sms_logs_status_idx" ON "sms_logs" USING btree ("status");
CREATE INDEX "sms_logs_created_at_idx" ON "sms_logs" USING btree ("created_at");
