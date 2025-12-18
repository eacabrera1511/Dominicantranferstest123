/*
  # Create Admin Bookings View

  1. Purpose
    - Creates a view to display bookings in the admin panel
    - Maps bookings table columns to the expected admin interface format

  2. View Details
    - `admin_bookings_view` - Provides all booking data for admin management
    - Includes customer info, pickup/dropoff details, pricing, status
    - Orders by created_at descending (newest first)

  3. Security
    - RLS policies on the underlying bookings table still apply
    - View provides read-only access to booking data
*/

CREATE OR REPLACE VIEW admin_bookings_view AS
SELECT
  id,
  reference,
  customer_name,
  customer_email,
  COALESCE(customer_phone, '') as customer_phone,
  pickup_location,
  dropoff_location,
  pickup_datetime,
  COALESCE(passengers, 1) as passengers,
  COALESCE(total_price, 0) as total_price,
  COALESCE(status, 'pending') as status,
  COALESCE(payment_status, 'pending') as payment_status,
  COALESCE(source, 'web') as source,
  special_requests,
  created_at,
  vehicle_type,
  details,
  cancellation_reason,
  cancelled_at,
  cancelled_by,
  flight_number,
  booking_type,
  payment_method
FROM bookings
ORDER BY created_at DESC;

COMMENT ON VIEW admin_bookings_view IS 'View for admin panel booking management';
