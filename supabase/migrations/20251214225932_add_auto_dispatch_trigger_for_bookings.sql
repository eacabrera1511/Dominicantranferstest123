/*
  # Add Auto-Dispatch Trigger for New Bookings
  
  1. Changes
    - Create a trigger that automatically calls the auto-dispatch edge function when a new booking is created
    - Only triggers for confirmed bookings with 'pending_dispatch' workflow status
    - Uses pg_net to make HTTP request to auto-dispatch function
  
  2. Benefits
    - Automatic driver assignment for all new bookings
    - Real-time dispatch without manual intervention
    - Seamless integration between booking and dispatch systems
*/

-- Create function to trigger auto-dispatch
CREATE OR REPLACE FUNCTION trigger_auto_dispatch()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
  function_url text;
BEGIN
  -- Only trigger for new confirmed bookings that need dispatch
  IF NEW.status = 'confirmed' AND NEW.workflow_status = 'pending_dispatch' THEN
    -- Get the function URL
    function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/auto-dispatch';
    
    -- Make async HTTP request to auto-dispatch function
    -- Note: This requires pg_net extension
    SELECT net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'booking_id', NEW.id::text,
        'vehicle_type', NEW.vehicle_type,
        'pickup_datetime', NEW.pickup_datetime
      )
    ) INTO request_id;
    
    -- Log the dispatch attempt
    RAISE NOTICE 'Auto-dispatch triggered for booking %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on bookings table
DROP TRIGGER IF EXISTS trigger_new_booking_auto_dispatch ON bookings;

CREATE TRIGGER trigger_new_booking_auto_dispatch
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_dispatch();

-- Enable pg_net extension if not already enabled (required for HTTP requests)
CREATE EXTENSION IF NOT EXISTS pg_net;
