-- ENUMS
DO $$ BEGIN CREATE TYPE customer_status AS ENUM ('active', 'inactive', 'blocked', 'vip'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE company_status AS ENUM ('active', 'suspended', 'inactive'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE payment_method_enum AS ENUM ('credit_card', 'bank_transfer', 'cash', 'corporate_billing'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE notification_status_enum AS ENUM ('pending', 'sent', 'failed', 'read'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- COMPANIES
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  primary_contact_email text NOT NULL,
  credit_limit numeric DEFAULT 0,
  payment_terms_days integer DEFAULT 30,
  status company_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- BOOKING_SEGMENTS
CREATE TABLE IF NOT EXISTS booking_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  segment_number integer NOT NULL,
  pickup_address text NOT NULL,
  dropoff_address text NOT NULL,
  pickup_datetime timestamptz NOT NULL,
  total_price numeric DEFAULT 0,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- VEHICLE_TYPES
CREATE TABLE IF NOT EXISTS vehicle_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name text NOT NULL,
  passenger_capacity integer NOT NULL,
  base_rate numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- PARTNER_COMMISSIONS
CREATE TABLE IF NOT EXISTS partner_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  commission_amount numeric NOT NULL,
  gross_amount numeric NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number text UNIQUE NOT NULL DEFAULT 'PAY-' || TO_CHAR(now(), 'YYYYMMDD') || '-0000',
  amount numeric NOT NULL,
  payment_method payment_method_enum NOT NULL,
  status payment_status_enum DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  status notification_status_enum DEFAULT 'pending',
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- AUDIT_LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz DEFAULT now()
);

-- INDEXES (create after tables exist)
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_booking_segments_booking ON booking_segments(booking_id);
  CREATE INDEX IF NOT EXISTS idx_partner_commissions_partner ON partner_commissions(partner_id);
  CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
  CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
EXCEPTION
  WHEN OTHERS THEN null;
END $$;