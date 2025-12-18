/*
  # CRM Foundation - Customer Management & Corporate Accounts

  ## Overview
  Creates the core CRM entities for managing customers, corporate accounts, and their relationships.
  This enables full B2C and B2B customer lifecycle management.

  ## New Tables

  ### 1. `customers` - Core CRM customer profiles
  Central customer database auto-populated from chat bookings and manual entries.
  
  **Columns:**
  - `id` (uuid, PK) - Unique customer identifier
  - `email` (text, unique) - Primary contact email
  - `phone` (text) - Primary phone number
  - `first_name` (text) - Customer first name
  - `last_name` (text) - Customer last name
  - `company_name` (text, nullable) - Company affiliation
  - `customer_type` (text) - 'individual' or 'corporate'
  - `vip_status` (boolean) - VIP flag for premium service
  - `preferred_language` (text) - Communication language preference
  - `notes` (text, nullable) - Internal CRM notes
  - `total_bookings` (integer) - Lifetime booking count
  - `total_spent` (numeric) - Lifetime revenue value
  - `average_rating` (numeric) - Average customer satisfaction
  - `corporate_account_id` (uuid, nullable, FK) - Link to corporate account
  - `created_at` (timestamptz) - Account creation date
  - `updated_at` (timestamptz) - Last profile update
  - `last_booking_at` (timestamptz, nullable) - Most recent booking date

  ### 2. `corporate_accounts` - B2B customer accounts
  Manages corporate clients with billing terms, credit limits, and contract details.
  
  **Columns:**
  - `id` (uuid, PK) - Unique corporate account ID
  - `company_name` (text, unique) - Legal business name
  - `industry` (text) - Business sector
  - `tax_id` (text) - Tax/VAT identification number
  - `billing_address` (text) - Corporate billing address
  - `billing_email` (text) - Invoicing contact email
  - `credit_limit` (numeric) - Maximum outstanding balance allowed
  - `payment_terms_days` (integer) - Net payment terms (e.g., NET30)
  - `discount_percentage` (numeric) - Corporate discount rate
  - `account_manager_id` (uuid, nullable) - Assigned relationship manager
  - `contract_start_date` (date, nullable) - Contract effective date
  - `contract_end_date` (date, nullable) - Contract expiration date
  - `status` (text) - 'active', 'suspended', 'inactive'
  - `created_at` (timestamptz) - Account creation date
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. `customer_addresses` - Multi-address support
  Stores pickup/dropoff locations, home, office addresses for quick booking.
  
  **Columns:**
  - `id` (uuid, PK)
  - `customer_id` (uuid, FK) - Customer owner
  - `address_type` (text) - 'home', 'office', 'airport', 'other'
  - `label` (text) - User-friendly name (e.g., "Home", "JFK Terminal 4")
  - `street_address` (text) - Full street address
  - `city` (text) - City name
  - `state` (text, nullable) - State/province
  - `postal_code` (text, nullable) - ZIP/postal code
  - `country` (text) - Country
  - `coordinates` (jsonb) - {lat, lng} for mapping
  - `is_default` (boolean) - Default pickup location
  - `created_at` (timestamptz)

  ### 4. `customer_preferences` - Service preferences & behavior
  Tracks customer preferences to enable personalized service.
  
  **Columns:**
  - `id` (uuid, PK)
  - `customer_id` (uuid, FK, unique) - One-to-one with customer
  - `preferred_vehicle_types` (jsonb) - Array of preferred vehicle categories
  - `requires_child_seat` (boolean) - Child seat requirement
  - `requires_wheelchair` (boolean) - Wheelchair accessibility need
  - `preferred_payment_method` (text) - 'card', 'corporate_billing', 'cash'
  - `preferred_driver_ids` (jsonb) - Array of favorite driver IDs
  - `special_requirements` (text, nullable) - Custom service needs
  - `communication_preferences` (jsonb) - Email/SMS/app notification settings
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Admin full access
  - Agents can view and update customer records
  - Customers can view their own data (future: when customer auth is added)

  ## Indexes
  - Customer email lookup (frequent search)
  - Corporate account company name lookup
  - Customer last booking date (for retention analysis)
  - Customer addresses by customer_id (quick address retrieval)
*/

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  phone text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  company_name text,
  customer_type text NOT NULL DEFAULT 'individual' CHECK (customer_type IN ('individual', 'corporate')),
  vip_status boolean DEFAULT false,
  preferred_language text DEFAULT 'en',
  notes text,
  total_bookings integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  average_rating numeric DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
  corporate_account_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_booking_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_corporate_account ON customers(corporate_account_id);
CREATE INDEX IF NOT EXISTS idx_customers_last_booking ON customers(last_booking_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all customers"
  ON customers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Agents can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_agents
      WHERE support_agents.email = auth.jwt()->>'email'
    )
  );

-- =====================================================
-- CORPORATE ACCOUNTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS corporate_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text UNIQUE NOT NULL,
  industry text,
  tax_id text,
  billing_address text,
  billing_email text NOT NULL,
  credit_limit numeric DEFAULT 10000,
  payment_terms_days integer DEFAULT 30,
  discount_percentage numeric DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  account_manager_id uuid,
  contract_start_date date,
  contract_end_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corporate_accounts_status ON corporate_accounts(status);
CREATE INDEX IF NOT EXISTS idx_corporate_accounts_manager ON corporate_accounts(account_manager_id);

ALTER TABLE corporate_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage corporate accounts"
  ON corporate_accounts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Agents can view corporate accounts"
  ON corporate_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_agents
      WHERE support_agents.email = auth.jwt()->>'email'
    )
  );

-- Add foreign key after corporate_accounts exists
ALTER TABLE customers 
  ADD CONSTRAINT fk_customers_corporate_account 
  FOREIGN KEY (corporate_account_id) 
  REFERENCES corporate_accounts(id) ON DELETE SET NULL;

-- =====================================================
-- CUSTOMER ADDRESSES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  address_type text NOT NULL CHECK (address_type IN ('home', 'office', 'airport', 'other')),
  label text NOT NULL,
  street_address text NOT NULL,
  city text NOT NULL,
  state text,
  postal_code text,
  country text NOT NULL,
  coordinates jsonb DEFAULT '{}'::jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_default ON customer_addresses(customer_id, is_default);

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage customer addresses"
  ON customer_addresses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Agents can view customer addresses"
  ON customer_addresses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_agents
      WHERE support_agents.email = auth.jwt()->>'email'
    )
  );

-- =====================================================
-- CUSTOMER PREFERENCES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid UNIQUE NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  preferred_vehicle_types jsonb DEFAULT '[]'::jsonb,
  requires_child_seat boolean DEFAULT false,
  requires_wheelchair boolean DEFAULT false,
  preferred_payment_method text DEFAULT 'card' CHECK (preferred_payment_method IN ('card', 'corporate_billing', 'cash', 'invoice')),
  preferred_driver_ids jsonb DEFAULT '[]'::jsonb,
  special_requirements text,
  communication_preferences jsonb DEFAULT '{"email": true, "sms": true, "push": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage customer preferences"
  ON customer_preferences FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Agents can view customer preferences"
  ON customer_preferences FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_agents
      WHERE support_agents.email = auth.jwt()->>'email'
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Update customers.updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

CREATE TRIGGER trigger_update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

-- Update corporate_accounts.updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_corporate_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

CREATE TRIGGER trigger_update_corporate_accounts_updated_at
  BEFORE UPDATE ON corporate_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_corporate_accounts_updated_at();

-- Update customer_preferences.updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_customer_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

CREATE TRIGGER trigger_update_customer_preferences_updated_at
  BEFORE UPDATE ON customer_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_preferences_updated_at();