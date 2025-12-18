/*
  # Partner Financial Credentials

  1. New Tables
    - `partner_credentials`
      - `id` (uuid, primary key)
      - `partner_id` (uuid, foreign key) - Reference to partner
      - `legal_business_name` (text) - Official registered business name
      - `vat_number` (text) - VAT/Tax registration number
      - `company_registration` (text) - Company registration/incorporation number
      - `tax_id` (text) - Tax identification number
      - `billing_address` (text) - Billing street address
      - `billing_city` (text) - Billing city
      - `billing_postal_code` (text) - Billing postal/zip code
      - `billing_country` (text) - Billing country
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `partner_payout_methods`
      - `id` (uuid, primary key)
      - `partner_id` (uuid, foreign key) - Reference to partner
      - `payout_method` (text) - bank_transfer, paypal, wise, etc.
      - `is_primary` (boolean) - Primary payout method
      - `bank_name` (text) - Bank name
      - `bank_country` (text) - Bank country
      - `account_holder_name` (text) - Name on the account
      - `iban` (text) - IBAN for European transfers
      - `swift_bic` (text) - SWIFT/BIC code
      - `account_number` (text) - Account number (non-IBAN)
      - `routing_number` (text) - Routing number (US banks)
      - `paypal_email` (text) - PayPal email address
      - `wise_email` (text) - Wise email address
      - `currency` (text) - Preferred payout currency
      - `status` (text) - pending_verification, verified, rejected
      - `verified_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (demo mode)
    - Note: In production, sensitive fields should be encrypted

  3. Indexes
    - Add indexes for partner lookups
*/

-- Partner Credentials Table (Legal/Tax Info)
CREATE TABLE IF NOT EXISTS partner_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid UNIQUE NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  legal_business_name text,
  vat_number text,
  company_registration text,
  tax_id text,
  billing_address text,
  billing_city text,
  billing_postal_code text,
  billing_country text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE partner_credentials ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partner_credentials' AND policyname = 'Anyone can view partner credentials'
  ) THEN
    CREATE POLICY "Anyone can view partner credentials" ON partner_credentials FOR SELECT TO public USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partner_credentials' AND policyname = 'Anyone can create partner credentials'
  ) THEN
    CREATE POLICY "Anyone can create partner credentials" ON partner_credentials FOR INSERT TO public WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partner_credentials' AND policyname = 'Anyone can update partner credentials'
  ) THEN
    CREATE POLICY "Anyone can update partner credentials" ON partner_credentials FOR UPDATE TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Partner Payout Methods Table (Bank/Payment Info)
CREATE TABLE IF NOT EXISTS partner_payout_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  payout_method text NOT NULL DEFAULT 'bank_transfer',
  is_primary boolean DEFAULT false,
  bank_name text,
  bank_country text,
  account_holder_name text,
  iban text,
  swift_bic text,
  account_number text,
  routing_number text,
  paypal_email text,
  wise_email text,
  currency text DEFAULT 'EUR',
  status text DEFAULT 'pending_verification',
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE partner_payout_methods ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partner_payout_methods' AND policyname = 'Anyone can view payout methods'
  ) THEN
    CREATE POLICY "Anyone can view payout methods" ON partner_payout_methods FOR SELECT TO public USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partner_payout_methods' AND policyname = 'Anyone can create payout methods'
  ) THEN
    CREATE POLICY "Anyone can create payout methods" ON partner_payout_methods FOR INSERT TO public WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partner_payout_methods' AND policyname = 'Anyone can update payout methods'
  ) THEN
    CREATE POLICY "Anyone can update payout methods" ON partner_payout_methods FOR UPDATE TO public USING (true) WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partner_payout_methods' AND policyname = 'Anyone can delete payout methods'
  ) THEN
    CREATE POLICY "Anyone can delete payout methods" ON partner_payout_methods FOR DELETE TO public USING (true);
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_credentials_partner_id ON partner_credentials(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_payout_methods_partner_id ON partner_payout_methods(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_payout_methods_is_primary ON partner_payout_methods(is_primary);
CREATE INDEX IF NOT EXISTS idx_partner_payout_methods_status ON partner_payout_methods(status);

-- Function to ensure only one primary payout method per partner
CREATE OR REPLACE FUNCTION ensure_single_primary_payout()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE partner_payout_methods
    SET is_primary = false
    WHERE partner_id = NEW.partner_id
    AND id != NEW.id
    AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_single_primary_payout_trigger'
  ) THEN
    CREATE TRIGGER ensure_single_primary_payout_trigger
      BEFORE INSERT OR UPDATE ON partner_payout_methods
      FOR EACH ROW
      EXECUTE FUNCTION ensure_single_primary_payout();
  END IF;
END $$;

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_partner_credentials_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'partner_credentials_updated_at_trigger'
  ) THEN
    CREATE TRIGGER partner_credentials_updated_at_trigger
      BEFORE UPDATE ON partner_credentials
      FOR EACH ROW
      EXECUTE FUNCTION update_partner_credentials_timestamp();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_partner_payout_methods_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'partner_payout_methods_updated_at_trigger'
  ) THEN
    CREATE TRIGGER partner_payout_methods_updated_at_trigger
      BEFORE UPDATE ON partner_payout_methods
      FOR EACH ROW
      EXECUTE FUNCTION update_partner_payout_methods_timestamp();
  END IF;
END $$;