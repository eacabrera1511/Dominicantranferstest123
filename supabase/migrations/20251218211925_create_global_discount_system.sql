/*
  # Global Discount System

  ## Overview
  Creates a global discount system that allows admins to set a percentage discount that applies to all pricing calculations across the entire platform.

  ## New Tables

  ### `global_discount_settings`
  Stores the global discount percentage that applies to all services.
  
  **Columns:**
  - `id` (uuid, PK) - Unique identifier
  - `discount_percentage` (numeric) - The discount percentage to apply (0-100)
  - `is_active` (boolean) - Whether the discount is currently active
  - `reason` (text) - Optional reason for the discount (e.g., "Holiday Sale", "Promotional Discount")
  - `start_date` (timestamptz) - When the discount starts
  - `end_date` (timestamptz, nullable) - When the discount ends (null = no end date)
  - `created_by` (text) - Email of admin who created the discount
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS enabled on the table
  - Only admins can modify discount settings
  - Public users can read active discount settings for price calculations

  ## Features
  - Single active discount at a time
  - Discount percentage validation (0-100)
  - Automatic timestamp updates
  - Audit trail of who created/modified discounts
*/

-- =====================================================
-- GLOBAL DISCOUNT SETTINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS global_discount_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_percentage numeric NOT NULL DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  is_active boolean DEFAULT false,
  reason text,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_global_discount_active ON global_discount_settings(is_active);

-- Enable RLS
ALTER TABLE global_discount_settings ENABLE ROW LEVEL SECURITY;

-- Public can view active discount settings
CREATE POLICY "Anyone can view active discount settings"
  ON global_discount_settings FOR SELECT
  TO public
  USING (is_active = true);

-- Only admins can manage discount settings
CREATE POLICY "Admins can manage discount settings"
  ON global_discount_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_global_discount_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

CREATE TRIGGER trigger_update_global_discount_settings_updated_at
  BEFORE UPDATE ON global_discount_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_global_discount_settings_updated_at();

-- Function to get current active discount percentage
CREATE OR REPLACE FUNCTION get_active_discount_percentage()
RETURNS numeric AS $$
DECLARE
  discount numeric;
BEGIN
  SELECT discount_percentage INTO discount
  FROM global_discount_settings
  WHERE is_active = true
    AND start_date <= now()
    AND (end_date IS NULL OR end_date > now())
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(discount, 0);
END;
$$ LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp;

-- Function to apply discount to a price
CREATE OR REPLACE FUNCTION apply_global_discount(original_price numeric)
RETURNS numeric AS $$
DECLARE
  discount_pct numeric;
  discounted_price numeric;
BEGIN
  discount_pct := get_active_discount_percentage();
  
  IF discount_pct > 0 THEN
    discounted_price := original_price * (1 - (discount_pct / 100));
    RETURN ROUND(discounted_price, 2);
  ELSE
    RETURN original_price;
  END IF;
END;
$$ LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp;

-- =====================================================
-- INSERT INITIAL 80% DISCOUNT
-- =====================================================

INSERT INTO global_discount_settings (
  discount_percentage,
  is_active,
  reason,
  start_date,
  created_by
) VALUES (
  80,
  true,
  'Promotional Discount - 80% Off All Services',
  now(),
  'system'
);
