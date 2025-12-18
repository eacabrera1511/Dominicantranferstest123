/*
  # Add payment_details column to bookings table

  1. Changes
    - Add `payment_details` JSONB column to `bookings` table
    - This column stores Stripe payment information:
      - stripe_session_id
      - stripe_payment_intent
      - paid_amount
      - currency
      - paid_at timestamp
      - failure_message (if payment failed)

  2. Purpose
    - Enable proper Stripe webhook handling
    - Store complete payment audit trail
    - Support payment reconciliation
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_details'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_details jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

COMMENT ON COLUMN bookings.payment_details IS 'Stores Stripe payment details including session_id, payment_intent, amount, and timestamps';