/*
  # Fix and Improve Booking Email Automation Trigger

  1. Problem
    - Database trigger for email notifications has URL construction issues
    - Needs better error handling and logging
    - Should work reliably with Resend API

  2. Solution
    - Simplified trigger function with hardcoded Supabase URL
    - Better error handling and logging
    - Ensures emails are triggered for every booking
    - Works with Resend test mode and production mode

  3. Note
    - Resend MUST have dominicantransfers.nl domain verified to send to customers
    - Currently in test mode - only sends to eacabrera1511@gmail.com
    - Once domain is verified, all customer emails will work automatically
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trigger_new_booking_notification ON bookings;
DROP FUNCTION IF EXISTS notify_new_booking();

-- Create improved trigger function
CREATE OR REPLACE FUNCTION notify_new_booking()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  function_url text;
  request_id bigint;
  supabase_url text := 'https://gwlaxeonvfywhecwtupv.supabase.co';
BEGIN
  -- Build function URL using known Supabase URL
  function_url := supabase_url || '/functions/v1/handle-new-booking';

  -- Log the booking that needs email
  RAISE NOTICE 'Triggering email notification for booking ID: %, Reference: %, Email: %', 
    NEW.id, NEW.reference, NEW.customer_email;

  -- Make async HTTP request to edge function using pg_net
  BEGIN
    SELECT net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'booking_id', NEW.id::text
      )
    ) INTO request_id;

    RAISE NOTICE '✅ Email notification queued successfully for booking % - request_id: %', NEW.id, request_id;

  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the booking insert
    RAISE WARNING '❌ Failed to queue email notification for booking %: % (SQLSTATE: %)', 
      NEW.id, SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$$;

-- Create trigger to fire after booking insert
CREATE TRIGGER trigger_new_booking_notification
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_booking();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, service_role;
GRANT EXECUTE ON FUNCTION net.http_post TO postgres, service_role;

-- Add helpful comments
COMMENT ON FUNCTION notify_new_booking() IS 
'Automatically sends email notifications to customer and dispatch team after booking creation. 
Note: Requires Resend domain verification to send to customer emails.';

COMMENT ON TRIGGER trigger_new_booking_notification ON bookings IS 
'Triggers email notifications for new bookings via handle-new-booking edge function';
