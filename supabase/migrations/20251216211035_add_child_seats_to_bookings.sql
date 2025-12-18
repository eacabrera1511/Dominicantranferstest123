/*
  # Add Child Seats to Bookings

  1. Changes
    - Add child_seats column to bookings table to track number of child seats requested
    - Add child_seat_price column to store the price charged for child seats
    - These fields allow proper tracking of child seat requests and pricing

  2. Benefits
    - Better tracking of customer requirements
    - Transparent pricing breakdown
    - Improved service customization
*/

-- Add child_seats column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'child_seats'
  ) THEN
    ALTER TABLE bookings ADD COLUMN child_seats integer DEFAULT 0;
  END IF;
END $$;

-- Add child_seat_price column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'child_seat_price'
  ) THEN
    ALTER TABLE bookings ADD COLUMN child_seat_price numeric(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN bookings.child_seats IS 'Number of child seats requested for the transfer';
COMMENT ON COLUMN bookings.child_seat_price IS 'Total price charged for child seats';
