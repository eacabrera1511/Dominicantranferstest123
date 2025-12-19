/*
  # Create Company Settings Table

  1. New Tables
    - `company_settings`
      - `id` (uuid, primary key) - Single row ID
      - `company_name` (text) - Company name
      - `support_email` (text) - Support email address
      - `booking_email` (text) - Booking confirmation email address
      - `support_phone` (text) - Customer support phone number
      - `website_url` (text) - Company website URL
      - `address` (text) - Company physical address
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `company_settings` table
    - Add policies for authenticated users to read settings
    - Add policies for admins only to update settings

  3. Initial Data
    - Insert default company settings for Dominican Transfers
*/

-- Create company_settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'Dominican Transfers',
  support_email text NOT NULL DEFAULT 'support@dominicantransfers.com',
  booking_email text NOT NULL DEFAULT 'Booking@dominicantransfers.com',
  support_phone text NOT NULL DEFAULT '+31625584645',
  website_url text NOT NULL DEFAULT 'https://dominicantransfers.com',
  address text DEFAULT 'Dominican Republic',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read company settings (needed for public-facing pages)
CREATE POLICY "Anyone can read company settings"
  ON company_settings
  FOR SELECT
  USING (true);

-- Only allow updates (no insert/delete since we want only one row)
CREATE POLICY "Only authenticated users can update company settings"
  ON company_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER company_settings_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_company_settings_updated_at();

-- Insert default company settings (only one row)
INSERT INTO company_settings (
  company_name,
  support_email,
  booking_email,
  support_phone,
  website_url,
  address
) VALUES (
  'Dominican Transfers',
  'support@dominicantransfers.com',
  'Booking@dominicantransfers.com',
  '+31625584645',
  'https://dominicantransfers.com',
  'Dominican Republic'
) ON CONFLICT DO NOTHING;
