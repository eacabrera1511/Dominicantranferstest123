/*
  # Dynamic Pricing Engine & Geographic Zones

  ## Overview
  Comprehensive rule-based pricing system with zone management, distance-based pricing,
  time-based multipliers, and corporate rate cards. Enables AI-assisted quote generation.

  ## New Tables

  ### 1. `pricing_zones` - Geographic service areas
  Defines service zones for zone-based pricing (airports, city centers, regions).
  
  **Columns:**
  - `id` (uuid, PK) - Unique zone identifier
  - `zone_name` (text, unique) - Display name (e.g., "JFK Airport", "Manhattan")
  - `zone_code` (text, unique) - Short code for references (e.g., "JFK", "MHT")
  - `zone_type` (text) - 'airport', 'city_center', 'suburb', 'region'
  - `boundary` (jsonb) - GeoJSON polygon or circle defining zone area
  - `center_point` (jsonb) - {lat, lng} for zone center
  - `is_active` (boolean) - Zone currently in use
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `pricing_rules` - Dynamic pricing rule engine
  Rule-based pricing with conditions and multipliers for flexible rate management.
  
  **Columns:**
  - `id` (uuid, PK) - Unique rule identifier
  - `rule_name` (text) - Descriptive rule name
  - `rule_type` (text) - 'base_rate', 'distance', 'time_multiplier', 'zone_to_zone', 'vehicle_type', 'surge'
  - `priority` (integer) - Rule application order (lower = higher priority)
  - `is_active` (boolean) - Rule enabled/disabled
  - `vehicle_types` (jsonb) - Array of applicable vehicle types (null = all)
  - `from_zone_id` (uuid, FK, nullable) - Origin zone for zone-to-zone rules
  - `to_zone_id` (uuid, FK, nullable) - Destination zone
  - `base_price` (numeric, nullable) - Fixed base price
  - `price_per_mile` (numeric, nullable) - Per-mile rate
  - `price_per_minute` (numeric, nullable) - Per-minute rate
  - `time_multiplier` (numeric, nullable) - Time-based multiplier (e.g., 1.5 for peak hours)
  - `day_of_week` (jsonb, nullable) - Array of applicable days [1-7] (1=Monday)
  - `time_range_start` (time, nullable) - Rule start time
  - `time_range_end` (time, nullable) - Rule end time
  - `date_range_start` (date, nullable) - Seasonal start date
  - `date_range_end` (date, nullable) - Seasonal end date
  - `minimum_charge` (numeric, nullable) - Minimum fare for this rule
  - `maximum_charge` (numeric, nullable) - Maximum fare cap
  - `conditions` (jsonb) - Additional conditions (weather, demand, etc.)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `corporate_rate_cards` - B2B negotiated rates
  Pre-negotiated rates for corporate accounts, overriding standard pricing.
  
  **Columns:**
  - `id` (uuid, PK)
  - `corporate_account_id` (uuid, FK) - Associated corporate account
  - `route_name` (text) - Friendly route name
  - `from_zone_id` (uuid, FK, nullable) - Origin zone
  - `to_zone_id` (uuid, FK, nullable) - Destination zone
  - `vehicle_type` (text) - Applicable vehicle category
  - `flat_rate` (numeric, nullable) - Fixed price for route
  - `discount_percentage` (numeric, nullable) - Percentage off standard rate
  - `valid_from` (date) - Rate effective start date
  - `valid_until` (date, nullable) - Rate expiration date
  - `is_active` (boolean) - Rate currently valid
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `price_quotes` - Quote history and tracking
  Stores all generated quotes for audit trail and conversion analysis.
  
  **Columns:**
  - `id` (uuid, PK) - Unique quote identifier
  - `quote_number` (text, unique) - Human-readable quote reference
  - `customer_id` (uuid, FK, nullable) - Associated customer
  - `corporate_account_id` (uuid, FK, nullable) - Corporate account if applicable
  - `from_address` (text) - Pickup address
  - `to_address` (text) - Dropoff address
  - `from_zone_id` (uuid, FK, nullable) - Detected origin zone
  - `to_zone_id` (uuid, FK, nullable) - Detected destination zone
  - `distance_miles` (numeric) - Calculated distance
  - `duration_minutes` (integer) - Estimated duration
  - `vehicle_type` (text) - Requested vehicle type
  - `pickup_datetime` (timestamptz) - Requested pickup time
  - `base_price` (numeric) - Base fare component
  - `distance_price` (numeric) - Distance-based component
  - `time_price` (numeric) - Time-based component
  - `multipliers_applied` (jsonb) - Array of applied multipliers
  - `total_price` (numeric) - Final quoted price
  - `rules_applied` (jsonb) - Array of pricing rule IDs used
  - `expires_at` (timestamptz) - Quote expiration
  - `status` (text) - 'draft', 'sent', 'accepted', 'expired', 'declined'
  - `converted_to_booking_id` (uuid, nullable) - Booking ID if accepted
  - `created_by` (text) - System or agent who generated quote
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Admins: full access to pricing configuration
  - Agents: can view pricing rules and generate quotes
  - Public: can request quotes via API (rate-limited)

  ## Indexes
  - Pricing rules by priority for fast rule matching
  - Active rules for filtering
  - Zone lookups by code
  - Corporate rate cards by account
  - Quotes by customer for history
*/

-- =====================================================
-- PRICING ZONES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS pricing_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name text UNIQUE NOT NULL,
  zone_code text UNIQUE NOT NULL,
  zone_type text NOT NULL CHECK (zone_type IN ('airport', 'city_center', 'suburb', 'region', 'landmark')),
  boundary jsonb DEFAULT '{}'::jsonb,
  center_point jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pricing_zones_code ON pricing_zones(zone_code);
CREATE INDEX IF NOT EXISTS idx_pricing_zones_active ON pricing_zones(is_active);

ALTER TABLE pricing_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active zones"
  ON pricing_zones FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage pricing zones"
  ON pricing_zones FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

-- =====================================================
-- PRICING RULES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  rule_type text NOT NULL CHECK (rule_type IN ('base_rate', 'distance', 'time_multiplier', 'zone_to_zone', 'vehicle_type', 'surge', 'holiday', 'corporate')),
  priority integer NOT NULL DEFAULT 100,
  is_active boolean DEFAULT true,
  vehicle_types jsonb DEFAULT '[]'::jsonb,
  from_zone_id uuid REFERENCES pricing_zones(id) ON DELETE SET NULL,
  to_zone_id uuid REFERENCES pricing_zones(id) ON DELETE SET NULL,
  base_price numeric,
  price_per_mile numeric,
  price_per_minute numeric,
  time_multiplier numeric DEFAULT 1.0,
  day_of_week jsonb,
  time_range_start time,
  time_range_end time,
  date_range_start date,
  date_range_end date,
  minimum_charge numeric,
  maximum_charge numeric,
  conditions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_priority ON pricing_rules(priority ASC);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_type ON pricing_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_zones ON pricing_rules(from_zone_id, to_zone_id);

ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view pricing rules"
  ON pricing_rules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_agents
      WHERE support_agents.email = auth.jwt()->>'email'
    ) OR EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Admins can manage pricing rules"
  ON pricing_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

-- =====================================================
-- CORPORATE RATE CARDS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS corporate_rate_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id uuid NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  route_name text NOT NULL,
  from_zone_id uuid REFERENCES pricing_zones(id) ON DELETE SET NULL,
  to_zone_id uuid REFERENCES pricing_zones(id) ON DELETE SET NULL,
  vehicle_type text NOT NULL,
  flat_rate numeric,
  discount_percentage numeric CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corporate_rate_cards_account ON corporate_rate_cards(corporate_account_id);
CREATE INDEX IF NOT EXISTS idx_corporate_rate_cards_active ON corporate_rate_cards(is_active);
CREATE INDEX IF NOT EXISTS idx_corporate_rate_cards_zones ON corporate_rate_cards(from_zone_id, to_zone_id);

ALTER TABLE corporate_rate_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage corporate rate cards"
  ON corporate_rate_cards FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Agents can view corporate rate cards"
  ON corporate_rate_cards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_agents
      WHERE support_agents.email = auth.jwt()->>'email'
    )
  );

-- =====================================================
-- PRICE QUOTES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS price_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  corporate_account_id uuid REFERENCES corporate_accounts(id) ON DELETE SET NULL,
  from_address text NOT NULL,
  to_address text NOT NULL,
  from_zone_id uuid REFERENCES pricing_zones(id) ON DELETE SET NULL,
  to_zone_id uuid REFERENCES pricing_zones(id) ON DELETE SET NULL,
  distance_miles numeric NOT NULL,
  duration_minutes integer NOT NULL,
  vehicle_type text NOT NULL,
  pickup_datetime timestamptz NOT NULL,
  base_price numeric DEFAULT 0,
  distance_price numeric DEFAULT 0,
  time_price numeric DEFAULT 0,
  multipliers_applied jsonb DEFAULT '[]'::jsonb,
  total_price numeric NOT NULL,
  rules_applied jsonb DEFAULT '[]'::jsonb,
  expires_at timestamptz NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'expired', 'declined')),
  converted_to_booking_id uuid,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_quotes_customer ON price_quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_price_quotes_corporate ON price_quotes(corporate_account_id);
CREATE INDEX IF NOT EXISTS idx_price_quotes_status ON price_quotes(status);
CREATE INDEX IF NOT EXISTS idx_price_quotes_created ON price_quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_quotes_number ON price_quotes(quote_number);

ALTER TABLE price_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all quotes"
  ON price_quotes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Agents can view and create quotes"
  ON price_quotes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_agents
      WHERE support_agents.email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Agents can insert quotes"
  ON price_quotes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_agents
      WHERE support_agents.email = auth.jwt()->>'email'
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Generate unique quote number
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS text AS $$
DECLARE
  new_number text;
  counter integer := 0;
BEGIN
  LOOP
    new_number := 'QT-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
    
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM price_quotes WHERE quote_number = new_number
    );
    
    counter := counter + 1;
    IF counter > 100 THEN
      RAISE EXCEPTION 'Unable to generate unique quote number';
    END IF;
  END LOOP;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Auto-generate quote number on insert
CREATE OR REPLACE FUNCTION set_quote_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
    NEW.quote_number := generate_quote_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

CREATE TRIGGER trigger_set_quote_number
  BEFORE INSERT ON price_quotes
  FOR EACH ROW
  EXECUTE FUNCTION set_quote_number();

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_pricing_zones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

CREATE TRIGGER trigger_update_pricing_zones_updated_at
  BEFORE UPDATE ON pricing_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_zones_updated_at();

CREATE OR REPLACE FUNCTION update_pricing_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

CREATE TRIGGER trigger_update_pricing_rules_updated_at
  BEFORE UPDATE ON pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_rules_updated_at();

CREATE OR REPLACE FUNCTION update_corporate_rate_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

CREATE TRIGGER trigger_update_corporate_rate_cards_updated_at
  BEFORE UPDATE ON corporate_rate_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_corporate_rate_cards_updated_at();

CREATE OR REPLACE FUNCTION update_price_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

CREATE TRIGGER trigger_update_price_quotes_updated_at
  BEFORE UPDATE ON price_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_price_quotes_updated_at();