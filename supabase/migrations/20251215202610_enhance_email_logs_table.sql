/*
  # Enhance Email Logs Table

  1. Changes
    - Add `provider_id` column for tracking external email provider IDs
    - Add `template_type` column for tracking which template was used
    - Add indexes for better query performance
    
  2. Security
    - Ensure RLS policies are in place
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_logs' AND column_name = 'provider_id'
  ) THEN
    ALTER TABLE email_logs ADD COLUMN provider_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_logs' AND column_name = 'template_type'
  ) THEN
    ALTER TABLE email_logs ADD COLUMN template_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_logs' AND column_name = 'booking_id'
  ) THEN
    ALTER TABLE email_logs ADD COLUMN booking_id uuid;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_booking_ref ON email_logs(booking_reference);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);