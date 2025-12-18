/*
  # Partner Portal Schema

  1. New Tables
    - `partners`
      - `id` (uuid, primary key)
      - `business_name` (text) - Company/business name
      - `contact_name` (text) - Primary contact person
      - `email` (text, unique) - Business email
      - `phone` (text) - Contact phone
      - `business_type` (text) - Type of business
      - `description` (text) - Business description
      - `logo_url` (text) - Company logo
      - `status` (text) - active, pending, suspended
      - `created_at`, `updated_at` (timestamptz)

  2. Changes to Existing Tables
    - Add `partner_id` to hotels table
    - Add `partner_id` to services table
    - Add `partner_id` to orders table

  3. Security
    - Enable RLS with public access policies (demo mode)

  4. Indexes
    - Add indexes for partner queries and analytics
*/

-- Partners Table
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  contact_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  business_type text NOT NULL DEFAULT 'general',
  description text,
  logo_url text,
  address text,
  city text,
  country text,
  website_url text,
  commission_rate numeric DEFAULT 10,
  status text DEFAULT 'pending',
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partners' AND policyname = 'Anyone can view partners'
  ) THEN
    CREATE POLICY "Anyone can view partners" ON partners FOR SELECT TO public USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partners' AND policyname = 'Anyone can create partners'
  ) THEN
    CREATE POLICY "Anyone can create partners" ON partners FOR INSERT TO public WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partners' AND policyname = 'Anyone can update partners'
  ) THEN
    CREATE POLICY "Anyone can update partners" ON partners FOR UPDATE TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Add partner_id to hotels table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hotels' AND column_name = 'partner_id'
  ) THEN
    ALTER TABLE hotels ADD COLUMN partner_id uuid REFERENCES partners(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add partner_id to services table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'partner_id'
  ) THEN
    ALTER TABLE services ADD COLUMN partner_id uuid REFERENCES partners(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add partner_id to orders table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'orders' AND column_name = 'partner_id'
    ) THEN
      ALTER TABLE orders ADD COLUMN partner_id uuid REFERENCES partners(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Indexes for partner analytics
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_business_type ON partners(business_type);
CREATE INDEX IF NOT EXISTS idx_partners_email ON partners(email);
CREATE INDEX IF NOT EXISTS idx_hotels_partner_id ON hotels(partner_id);
CREATE INDEX IF NOT EXISTS idx_services_partner_id ON services(partner_id);

-- Insert a demo partner for testing
INSERT INTO partners (id, business_name, contact_name, email, phone, business_type, description, status, verified, commission_rate, city, country)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Paradise Travel Co.',
  'John Smith',
  'partner@paradisetravel.com',
  '+31 6 1234 5678',
  'tour_operator',
  'Premium travel services across the Caribbean and Mediterranean. Specializing in luxury tours, yacht rentals, and exclusive experiences.',
  'active',
  true,
  12,
  'Amsterdam',
  'Netherlands'
) ON CONFLICT (email) DO NOTHING;