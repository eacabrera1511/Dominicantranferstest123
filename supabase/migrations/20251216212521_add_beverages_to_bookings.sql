/*
  # Add Beverages to Bookings

  1. Changes
    - Add beverages column to store beverage selections as JSONB
    - Add beverages_price column to store total price for beverages
    - These fields allow tracking of beverage orders and pricing

  2. Benefits
    - Complete tracking of all booking add-ons
    - Transparent pricing breakdown
    - Improved customer experience
*/

-- Add beverages column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'beverages'
  ) THEN
    ALTER TABLE bookings ADD COLUMN beverages jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add beverages_price column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'beverages_price'
  ) THEN
    ALTER TABLE bookings ADD COLUMN beverages_price numeric(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN bookings.beverages IS 'Beverage selections stored as JSON object with beverage IDs and quantities';
COMMENT ON COLUMN bookings.beverages_price IS 'Total price charged for all beverages';
