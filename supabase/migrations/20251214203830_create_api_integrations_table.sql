/*
  # API Integrations Configuration Table
  
  1. New Tables
    - `api_integrations`
      - `id` (uuid, primary key)
      - `integration_name` (text) - e.g., 'google_maps', 'flight_stats', 'twilio', 'stripe'
      - `api_key` (text) - Encrypted API key
      - `api_secret` (text, nullable) - For APIs requiring secret
      - `endpoint_url` (text, nullable) - Custom endpoint if needed
      - `is_active` (boolean) - Enable/disable integration
      - `configuration` (jsonb) - Flexible config for each integration
      - `last_tested_at` (timestamptz) - Last successful API test
      - `test_status` (text) - 'success', 'failed', 'not_tested'
      - `test_error` (text, nullable) - Last test error message
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `api_integrations` table
    - Only authenticated admin users can access
  
  3. Features
    - Secure storage of API credentials
    - Per-integration configuration
    - Health check tracking
    - Easy enable/disable toggles
*/

-- Create enum for test status
DO $$ BEGIN
  CREATE TYPE api_test_status AS ENUM ('not_tested', 'success', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create api_integrations table
CREATE TABLE IF NOT EXISTS api_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  api_key text,
  api_secret text,
  endpoint_url text,
  is_active boolean DEFAULT false,
  configuration jsonb DEFAULT '{}'::jsonb,
  last_tested_at timestamptz,
  test_status api_test_status DEFAULT 'not_tested',
  test_error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE api_integrations ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies
CREATE POLICY "Admin can view API integrations"
  ON api_integrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admin can insert API integrations"
  ON api_integrations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admin can update API integrations"
  ON api_integrations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_api_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER api_integrations_updated_at
  BEFORE UPDATE ON api_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_api_integrations_updated_at();

-- Insert default integration templates
INSERT INTO api_integrations (integration_name, display_name, description, configuration) VALUES
  ('google_maps', 'Google Maps API', 'Calculate distances, durations, and geocoding', '{
    "required_fields": ["api_key"],
    "endpoints": {
      "distance_matrix": "https://maps.googleapis.com/maps/api/distancematrix/json",
      "geocode": "https://maps.googleapis.com/maps/api/geocode/json",
      "directions": "https://maps.googleapis.com/maps/api/directions/json"
    },
    "docs_url": "https://developers.google.com/maps/documentation"
  }'::jsonb),
  
  ('flightstats', 'FlightStats API', 'Real-time flight tracking and status', '{
    "required_fields": ["api_key", "api_secret"],
    "endpoint_url": "https://api.flightstats.com/flex",
    "docs_url": "https://developer.flightstats.com/api-docs/"
  }'::jsonb),
  
  ('aviationstack', 'Aviation Stack', 'Alternative flight tracking (free tier available)', '{
    "required_fields": ["api_key"],
    "endpoint_url": "http://api.aviationstack.com/v1",
    "docs_url": "https://aviationstack.com/documentation"
  }'::jsonb),
  
  ('twilio', 'Twilio SMS', 'Send SMS notifications to customers and drivers', '{
    "required_fields": ["api_key", "api_secret"],
    "additional_fields": ["phone_number"],
    "endpoint_url": "https://api.twilio.com",
    "docs_url": "https://www.twilio.com/docs/sms"
  }'::jsonb),
  
  ('stripe', 'Stripe Payments', 'Process credit card payments', '{
    "required_fields": ["api_key"],
    "endpoint_url": "https://api.stripe.com",
    "docs_url": "https://stripe.com/docs/api"
  }'::jsonb),
  
  ('sendgrid', 'SendGrid Email', 'Send transactional emails', '{
    "required_fields": ["api_key"],
    "endpoint_url": "https://api.sendgrid.com/v3",
    "docs_url": "https://docs.sendgrid.com/api-reference"
  }'::jsonb)
ON CONFLICT (integration_name) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_integrations_name ON api_integrations(integration_name);
CREATE INDEX IF NOT EXISTS idx_api_integrations_active ON api_integrations(is_active) WHERE is_active = true;