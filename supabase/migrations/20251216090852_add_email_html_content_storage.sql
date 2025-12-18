/*
  # Add Email HTML Content Storage

  1. Changes
    - Add html_content column to email_logs for storing full email HTML
    - This enables viewing/copying emails when email provider isn't configured
  
  2. Purpose
    - Allow admins to view email content directly in the admin panel
    - Enable manual sending of emails when automated sending fails
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_logs' AND column_name = 'html_content'
  ) THEN
    ALTER TABLE email_logs ADD COLUMN html_content text;
  END IF;
END $$;