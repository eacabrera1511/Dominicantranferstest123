/*
  # Orders Table for Travel Bookings
  
  1. New Tables
    - `orders`
      - `id` (uuid, primary key) - Unique order identifier
      - `partner_id` (uuid, foreign key) - Reference to partner
      - `booking_type` (text) - Type of booking (hotel, flight, car_rental, etc.)
      - `item_name` (text) - Name of booked item/service
      - `quantity` (integer) - Number of items booked
      - `unit_price` (numeric) - Price per unit
      - `total_price` (numeric) - Total order price
      - `customer_name` (text) - Customer full name
      - `customer_email` (text) - Customer email
      - `customer_phone` (text) - Customer phone
      - `check_in_date` (timestamptz) - Check-in/start date
      - `check_out_date` (timestamptz) - Check-out/end date
      - `status` (text) - Order status (pending, confirmed, cancelled)
      - `payment_status` (text) - Payment status (pending, paid, refunded)
      - `payment_method` (text) - Payment method (ideal, card)
      - `payment_details` (jsonb) - Additional payment info
      - `details` (jsonb) - Additional booking details
      - `created_at` (timestamptz) - Order creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
  
  2. Security
    - Enable RLS on orders table
    - Add policies for public read/write access (demo mode)
  
  3. Indexes
    - Add indexes for common queries and analytics
*/

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners(id) ON DELETE SET NULL,
  booking_type text NOT NULL,
  item_name text NOT NULL,
  quantity integer DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  check_in_date timestamptz,
  check_out_date timestamptz,
  status text DEFAULT 'pending',
  payment_status text DEFAULT 'pending',
  payment_method text,
  payment_details jsonb DEFAULT '{}'::jsonb,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policies for demo mode
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Anyone can view orders'
  ) THEN
    CREATE POLICY "Anyone can view orders" ON orders FOR SELECT TO public USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Anyone can create orders'
  ) THEN
    CREATE POLICY "Anyone can create orders" ON orders FOR INSERT TO public WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Anyone can update orders'
  ) THEN
    CREATE POLICY "Anyone can update orders" ON orders FOR UPDATE TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_partner_id ON orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_booking_type ON orders(booking_type);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'orders_updated_at_trigger'
  ) THEN
    CREATE TRIGGER orders_updated_at_trigger
      BEFORE UPDATE ON orders
      FOR EACH ROW
      EXECUTE FUNCTION update_orders_updated_at();
  END IF;
END $$;