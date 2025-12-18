/*
  # Fix Booking Recovery Function with Correct Supabase URL

  1. Changes
    - Update process_incomplete_bookings function to use correct Supabase URL
    - Hard-code the URL and key since they're static for this project
    - Ensure pg_net calls work properly
*/

-- Update function to use correct Supabase URL
CREATE OR REPLACE FUNCTION process_incomplete_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  incomplete_booking_record RECORD;
  supabase_url TEXT;
  supabase_anon_key TEXT;
  payload JSONB;
  request_id BIGINT;
BEGIN
  -- Set Supabase URL and anon key
  supabase_url := 'https://gwlaxeonvfywhecwtupv.supabase.co';
  supabase_anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3bGF4ZW9udmZ5d2hlY3d0dXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3OTI2NDgsImV4cCI6MjA4MTM2ODY0OH0.YxJsMc9npxVhIZ6zeIfrAQp7pnZWHXotXGZrvqHzGDM';

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
      RAISE NOTICE 'Queued recovery email for booking % (request_id: %)', incomplete_booking_record.id, request_id;

    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue processing other bookings
      RAISE WARNING 'Failed to send recovery email for booking %: %', incomplete_booking_record.id, SQLERRM;
    END;
  END LOOP;
END;
$$;
