/*
  # Add Price Source Tracking to Bookings

  1. Changes
    - Add price_source column to bookings table to track booking origin
    - Add original_price column to store base price before any price matching
    - Add index for price_source filtering

  2. Values
    - 'standard': Regular booking at base price
    - 'price_match': Customer requested price match
    - 'promotion': Special promotion or discount

  3. Security
    - No RLS changes needed - inherits from existing bookings policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'price_source'
  ) THEN
    ALTER TABLE bookings ADD COLUMN price_source text DEFAULT 'standard';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'original_price'
  ) THEN
    ALTER TABLE bookings ADD COLUMN original_price numeric(10, 2);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_price_source ON bookings(price_source);

COMMENT ON COLUMN bookings.price_source IS 'Source of the booking price: standard, price_match, or promotion';
COMMENT ON COLUMN bookings.original_price IS 'Original base price before any price matching or discounts';
