/*
  # Add Admin Bookings Management Fields
  
  1. Changes to `bookings` table
    - Add `reference` column for booking reference number
    - Add `source` column to track booking origin (chat, web, phone, partner)
    - Add indexes for better query performance
  
  2. Create `admin_bookings_view` view
    - Joins bookings with customers table
    - Provides all fields needed by the admin panel
    - Maps column names to match frontend expectations
  
  3. Security
    - View inherits RLS from underlying tables
    - Admin users can query this view through service role
*/

-- Add missing columns to bookings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'reference'
  ) THEN
    ALTER TABLE bookings ADD COLUMN reference text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'source'
  ) THEN
    ALTER TABLE bookings ADD COLUMN source text DEFAULT 'web' CHECK (source IN ('chat', 'web', 'phone', 'partner'));
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(reference);
CREATE INDEX IF NOT EXISTS idx_bookings_source ON bookings(source);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- Generate references for existing bookings that don't have one
UPDATE bookings
SET reference = 'TRF-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
WHERE reference IS NULL OR reference = '';

-- Create a view for admin bookings with customer data
CREATE OR REPLACE VIEW admin_bookings_view AS
SELECT 
  b.id,
  b.reference,
  COALESCE(c.first_name || ' ' || c.last_name, 'Guest Customer') as customer_name,
  COALESCE(c.email, '') as customer_email,
  COALESCE(c.phone, '') as customer_phone,
  b.pickup_address as pickup_location,
  b.dropoff_address as dropoff_location,
  b.pickup_datetime,
  b.passenger_count as passengers,
  b.price as total_price,
  b.status,
  b.payment_status,
  COALESCE(b.source, 'web') as source,
  b.special_requests,
  b.created_at,
  b.updated_at,
  b.vehicle_type,
  b.workflow_status,
  c.id as customer_id
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id;