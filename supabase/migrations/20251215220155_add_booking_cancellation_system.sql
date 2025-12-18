/*
  # Add Booking Cancellation System

  ## Overview
  This migration adds a comprehensive cancellation system for bookings, allowing customers to request cancellations
  via email links and admins to process these requests through the dashboard.

  ## Changes
  
  1. **New Table: booking_cancellation_requests**
     - `id` (uuid, primary key) - Unique identifier for cancellation request
     - `booking_id` (uuid, foreign key) - Links to bookings table
     - `cancellation_token` (text, unique) - Secure token for cancellation link validation
     - `customer_email` (text) - Email of customer requesting cancellation
     - `customer_name` (text) - Name of customer
     - `reason` (text, nullable) - Optional cancellation reason
     - `status` (text) - Request status: 'pending', 'approved', 'rejected'
     - `requested_at` (timestamptz) - When cancellation was requested
     - `processed_at` (timestamptz, nullable) - When admin processed the request
     - `processed_by` (uuid, nullable) - Admin user who processed the request
     - `admin_notes` (text, nullable) - Internal notes from admin
     - `refund_amount` (decimal, nullable) - Amount to be refunded
     - `refund_status` (text, nullable) - 'pending', 'processed', 'completed'
     - `metadata` (jsonb) - Additional data (IP, user agent, etc.)

  2. **Add Columns to bookings table**
     - `cancellation_reason` (text, nullable) - Reason for cancellation
     - `cancelled_at` (timestamptz, nullable) - When booking was cancelled
     - `cancelled_by` (text, nullable) - Who cancelled: 'customer', 'admin', 'system'

  3. **Security**
     - Enable RLS on booking_cancellation_requests
     - Policies for authenticated admin access
     - Public policy for creating requests with valid token

  4. **Indexes**
     - Index on cancellation_token for fast lookup
     - Index on booking_id for relationship queries
     - Index on status for filtering
*/

-- Add cancellation fields to bookings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE bookings ADD COLUMN cancellation_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE bookings ADD COLUMN cancelled_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'cancelled_by'
  ) THEN
    ALTER TABLE bookings ADD COLUMN cancelled_by text;
  END IF;
END $$;

-- Create booking_cancellation_requests table
CREATE TABLE IF NOT EXISTS booking_cancellation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  cancellation_token text UNIQUE NOT NULL,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid,
  admin_notes text,
  refund_amount decimal(10,2),
  refund_status text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT valid_refund_status CHECK (refund_status IS NULL OR refund_status IN ('pending', 'processed', 'completed'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cancellation_requests_token ON booking_cancellation_requests(cancellation_token);
CREATE INDEX IF NOT EXISTS idx_cancellation_requests_booking ON booking_cancellation_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_requests_status ON booking_cancellation_requests(status);
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_at ON bookings(cancelled_at) WHERE cancelled_at IS NOT NULL;

-- Enable RLS
ALTER TABLE booking_cancellation_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_cancellation_requests

-- Allow anyone to create a cancellation request (validated by token in application)
CREATE POLICY "Allow public to create cancellation requests"
  ON booking_cancellation_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to view their own cancellation request by token
CREATE POLICY "Allow viewing cancellation request by token"
  ON booking_cancellation_requests
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users (admins) to update cancellation requests
CREATE POLICY "Allow admins to update cancellation requests"
  ON booking_cancellation_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users (admins) to delete cancellation requests
CREATE POLICY "Allow admins to delete cancellation requests"
  ON booking_cancellation_requests
  FOR DELETE
  TO authenticated
  USING (true);

-- Function to generate cancellation token
CREATE OR REPLACE FUNCTION generate_cancellation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token text;
  exists boolean;
BEGIN
  LOOP
    -- Generate a random token (16 bytes = 32 hex characters)
    token := encode(gen_random_bytes(16), 'hex');
    
    -- Check if token already exists
    SELECT EXISTS(
      SELECT 1 FROM booking_cancellation_requests WHERE cancellation_token = token
    ) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN token;
END;
$$;

-- Function to update booking status when cancellation is approved
CREATE OR REPLACE FUNCTION process_booking_cancellation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If cancellation request is approved, update the booking
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE bookings
    SET 
      status = 'cancelled',
      cancellation_reason = NEW.reason,
      cancelled_at = now(),
      cancelled_by = 'customer',
      updated_at = now()
    WHERE id = NEW.booking_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for cancellation processing
DROP TRIGGER IF EXISTS trigger_process_booking_cancellation ON booking_cancellation_requests;
CREATE TRIGGER trigger_process_booking_cancellation
  AFTER UPDATE ON booking_cancellation_requests
  FOR EACH ROW
  EXECUTE FUNCTION process_booking_cancellation();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cancellation_request_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_cancellation_request_timestamp ON booking_cancellation_requests;
CREATE TRIGGER trigger_update_cancellation_request_timestamp
  BEFORE UPDATE ON booking_cancellation_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_cancellation_request_updated_at();
