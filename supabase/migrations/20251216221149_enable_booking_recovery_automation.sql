/*
  # Enable Automated Booking Recovery System

  1. Extensions
    - Enable pg_cron for scheduled jobs
    - Enable pg_net for HTTP requests from database

  2. Functions
    - `process_incomplete_bookings()` - Finds incomplete bookings older than 15 minutes
      and triggers recovery email via edge function

  3. Scheduled Jobs
    - Runs every 5 minutes to check for abandoned bookings
    - Calls edge function to send recovery emails
    - Updates recovery_email_sent flag

  4. Changes
    - Automated server-side processing (no client-side setTimeout dependency)
    - Reliable email delivery for abandoned bookings
    - Runs continuously in background
*/

-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create function to process incomplete bookings and send recovery emails
CREATE OR REPLACE FUNCTION process_incomplete_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  incomplete_booking_record RECORD;
  recovery_url TEXT;
  supabase_url TEXT;
  supabase_anon_key TEXT;
  payload JSONB;
  request_id BIGINT;
BEGIN
  -- Get environment variables
  supabase_url := current_setting('app.settings.supabase_url', true);
  supabase_anon_key := current_setting('app.settings.supabase_anon_key', true);

  -- If settings not available, try to get from secrets (Supabase specific)
  IF supabase_url IS NULL THEN
    supabase_url := current_setting('request.headers', true)::json->>'x-supabase-url';
  END IF;

  -- Default to env variable approach
  IF supabase_url IS NULL THEN
    supabase_url := 'SUPABASE_URL_PLACEHOLDER';
  END IF;

  IF supabase_anon_key IS NULL THEN
    supabase_anon_key := 'SUPABASE_ANON_KEY_PLACEHOLDER';
  END IF;

  -- Loop through incomplete bookings that need recovery emails
  FOR incomplete_booking_record IN
    SELECT
      id,
      email,
      customer_name,
      phone,
      booking_data,
      calculated_price,
      created_at
    FROM incomplete_bookings
    WHERE completed = false
      AND recovery_email_sent = false
      AND created_at < (NOW() - INTERVAL '15 minutes')
      AND expires_at > NOW()
    ORDER BY created_at ASC
    LIMIT 10
  LOOP
    -- Build payload for edge function
    payload := jsonb_build_object(
      'incompleteBookingId', incomplete_booking_record.id,
      'email', incomplete_booking_record.email,
      'customerName', incomplete_booking_record.customer_name,
      'bookingDetails', jsonb_build_object(
        'vehicleName', COALESCE(incomplete_booking_record.booking_data->>'vehicleName', 'Transfer Service'),
        'route', COALESCE(incomplete_booking_record.booking_data->>'route', 'Airport Transfer'),
        'pickupDate', COALESCE(incomplete_booking_record.booking_data->>'pickupDate', 'TBD'),
        'pickupTime', COALESCE(incomplete_booking_record.booking_data->>'pickupTime', 'TBD'),
        'totalPrice', incomplete_booking_record.calculated_price
      )
    );

    -- Make HTTP request to edge function using pg_net
    BEGIN
      SELECT INTO request_id net.http_post(
        url := supabase_url || '/functions/v1/send-booking-recovery-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || supabase_anon_key
        ),
        body := payload
      );

      -- Mark as email sent (don't wait for response, fire and forget)
      UPDATE incomplete_bookings
      SET
        recovery_email_sent = true,
        updated_at = NOW()
      WHERE id = incomplete_booking_record.id;

      -- Log success
      RAISE NOTICE 'Queued recovery email for booking %', incomplete_booking_record.id;

    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue processing other bookings
      RAISE WARNING 'Failed to send recovery email for booking %: %', incomplete_booking_record.id, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- Create cron job to run every 5 minutes
-- First, remove any existing job with the same name
SELECT cron.unschedule('process-incomplete-bookings-every-5-min')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-incomplete-bookings-every-5-min'
);

-- Schedule the job to run every 5 minutes
SELECT cron.schedule(
  'process-incomplete-bookings-every-5-min',
  '*/5 * * * *', -- Every 5 minutes
  $$SELECT process_incomplete_bookings();$$
);

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION process_incomplete_bookings() TO postgres;

-- Create a manual trigger function that can be called for testing
CREATE OR REPLACE FUNCTION trigger_booking_recovery_check()
RETURNS TABLE(
  processed_count INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count incomplete bookings that need processing
  SELECT COUNT(*) INTO v_count
  FROM incomplete_bookings
  WHERE completed = false
    AND recovery_email_sent = false
    AND created_at < (NOW() - INTERVAL '15 minutes')
    AND expires_at > NOW();

  -- Process them
  PERFORM process_incomplete_bookings();

  -- Return result
  RETURN QUERY
  SELECT
    v_count,
    'Processed ' || v_count || ' incomplete booking(s)';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION trigger_booking_recovery_check() TO anon, authenticated;
