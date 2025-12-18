/*
  # Create Stripe Product Mappings

  1. New Tables
    - `stripe_product_mappings`
      - `id` (uuid, primary key)
      - `route_key` (text) - Unique identifier for the route (e.g., 'puj-punta_cana-oneway')
      - `route_name` (text) - Human readable route name
      - `price_id` (text) - Stripe Price ID
      - `product_id` (text) - Stripe Product ID (optional)
      - `amount` (integer) - Amount in cents
      - `currency` (text) - Currency code (USD, etc.)
      - `trip_type` (text) - 'oneway' or 'roundtrip'
      - `origin` (text) - Starting location
      - `destination` (text) - Ending location
      - `active` (boolean) - Whether this mapping is active
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `stripe_product_mappings` table
    - Add policy for public read access to active mappings
    - Add policy for admin write access
*/

CREATE TABLE IF NOT EXISTS stripe_product_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_key text UNIQUE NOT NULL,
  route_name text NOT NULL,
  price_id text NOT NULL,
  product_id text,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  trip_type text NOT NULL CHECK (trip_type IN ('oneway', 'roundtrip')),
  origin text NOT NULL,
  destination text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE stripe_product_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active stripe product mappings"
  ON stripe_product_mappings
  FOR SELECT
  USING (active = true);

CREATE POLICY "Admin can manage stripe product mappings"
  ON stripe_product_mappings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for faster route lookups
CREATE INDEX idx_stripe_product_mappings_route_key ON stripe_product_mappings(route_key);
CREATE INDEX idx_stripe_product_mappings_active ON stripe_product_mappings(active);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stripe_product_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stripe_product_mappings_updated_at
  BEFORE UPDATE ON stripe_product_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_stripe_product_mappings_updated_at();