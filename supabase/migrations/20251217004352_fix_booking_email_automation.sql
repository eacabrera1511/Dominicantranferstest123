/*
  # Fix Booking Email Automation

  1. Problem Fixed
    - Bookings created through UnifiedBookingModal don't trigger email notifications
    - No automatic email sending for customers and dispatch team

  2. Changes
    - Create database trigger function to automatically invoke handle-new-booking edge function
    - Trigger fires after every booking insert
    - Sends both customer confirmation and admin dispatch notification emails

  3. Security
    - Function runs with security definer to have necessary permissions
    - Uses service role key to invoke edge functions
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_new_booking_notification ON bookings;
DROP FUNCTION IF EXISTS notify_new_booking();

-- Create function to invoke handle-new-booking edge function
CREATE OR REPLACE FUNCTION notify_new_booking()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  supabase_url text;
  service_role_key text;
  function_url text;
  request_id bigint;
BEGIN
  -- Get Supabase URL from environment
  SELECT decrypted_secret INTO supabase_url
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_URL'
  LIMIT 1;

  -- Get Service Role Key from environment
  SELECT decrypted_secret INTO service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
  LIMIT 1;

  -- If secrets not in vault, try pg_net with default endpoint
  IF supabase_url IS NULL THEN
    supabase_url := current_setting('app.settings.supabase_url', true);
  END IF;

  IF supabase_url IS NULL THEN
    -- Construct from database connection
    supabase_url := 'https://' || split_part(current_setting('app.settings.api_url', true), '//', 2);
  END IF;

  -- Build function URL
  function_url := supabase_url || '/functions/v1/handle-new-booking';

  -- Make async HTTP request to edge function using pg_net
  SELECT net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    ),
    body := jsonb_build_object(
      'booking_id', NEW.id
    )
  ) INTO request_id;

  -- Log the request
  RAISE NOTICE 'Email notification request queued for booking %: request_id=%', NEW.id, request_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the booking insert
  RAISE WARNING 'Failed to queue email notification for booking %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger to fire after booking insert
CREATE TRIGGER trigger_new_booking_notification
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_booking();

-- Ensure pg_net extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, service_role;

-- Add comment
COMMENT ON FUNCTION notify_new_booking() IS 'Automatically sends email notifications to customer and dispatch team after booking creation';
COMMENT ON TRIGGER trigger_new_booking_notification ON bookings IS 'Triggers email notifications for new bookings';
