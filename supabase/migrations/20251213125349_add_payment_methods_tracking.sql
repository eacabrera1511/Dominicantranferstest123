/*
  # Enhanced Payment Tracking Schema

  1. Changes
    - Add `payment_method` column to orders table to track iDEAL vs credit card
    - Add `payment_details` jsonb column for additional payment metadata
    - Add indexes for faster payment queries
    
  2. Payment Methods Supported
    - iDEAL (Dutch bank transfers)
    - Credit Card (Visa, Mastercard, Amex)
    
  3. Details
    - payment_method: 'ideal' or 'card'
    - payment_details: stores bank name for iDEAL, last 4 digits for cards
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_method text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_details'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_details jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_booking_type ON orders(booking_type);