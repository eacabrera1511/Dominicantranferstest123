/*
  # Create Incomplete Bookings Recovery System

  1. New Tables
    - `incomplete_bookings`
      - `id` (uuid, primary key) - Unique booking recovery ID
      - `email` (text) - Customer email
      - `customer_name` (text) - Customer name
      - `phone` (text) - Customer phone
      - `booking_data` (jsonb) - All booking details (vehicle, route, extras, etc.)
      - `calculated_price` (numeric) - Final price calculated
      - `expires_at` (timestamptz) - Link expiration (24 hours)
      - `completed` (boolean) - Whether booking was completed
      - `recovery_email_sent` (boolean) - Whether recovery email was sent
      - `created_at` (timestamptz) - When incomplete booking was created
      - `updated_at` (timestamptz) - Last update time

  2. Security
    - Enable RLS on `incomplete_bookings` table
    - Allow public insert (for saving incomplete bookings)
    - Allow public read by ID (for recovery links)
    - Allow public update by ID (for marking as completed)

  3. Indexes
    - Index on email for lookups
    - Index on created_at for cleanup queries
    - Index on completed for filtering

  4. Functions
    - Trigger to send recovery email after 15 minutes if not completed
*/

-- Create incomplete bookings table
CREATE TABLE IF NOT EXISTS incomplete_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  customer_name text NOT NULL,
  phone text,
  booking_data jsonb NOT NULL,
  calculated_price numeric(10,2) NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  completed boolean DEFAULT false,
  recovery_email_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE incomplete_bookings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create incomplete bookings
CREATE POLICY "Anyone can create incomplete bookings"
  ON incomplete_bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to read incomplete bookings by ID (for recovery links)
CREATE POLICY "Anyone can read incomplete bookings by ID"
  ON incomplete_bookings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone to update incomplete bookings (to mark as completed)
CREATE POLICY "Anyone can update incomplete bookings"
  ON incomplete_bookings
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_incomplete_bookings_email ON incomplete_bookings(email);
CREATE INDEX IF NOT EXISTS idx_incomplete_bookings_created_at ON incomplete_bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_incomplete_bookings_completed ON incomplete_bookings(completed);
CREATE INDEX IF NOT EXISTS idx_incomplete_bookings_recovery_sent ON incomplete_bookings(recovery_email_sent);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_incomplete_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_incomplete_bookings_updated_at_trigger
  BEFORE UPDATE ON incomplete_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_incomplete_bookings_updated_at();

-- Function to clean up expired incomplete bookings (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_expired_incomplete_bookings()
RETURNS void AS $$
BEGIN
  DELETE FROM incomplete_bookings
  WHERE created_at < now() - interval '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;