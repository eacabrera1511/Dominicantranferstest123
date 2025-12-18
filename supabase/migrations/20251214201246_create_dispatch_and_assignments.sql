/*
  # Dispatch System & Driver Assignments

  ## Overview
  Complete dispatch management system linking bookings to drivers and vehicles,
  with real-time status tracking and trip lifecycle management.

  ## New Tables

  ### 1. `trip_assignments` - Driver/vehicle dispatch records
  Links bookings to specific drivers and vehicles with assignment tracking.
  
  **Columns:**
  - `id` (uuid, PK) - Unique assignment identifier
  - `booking_id` (uuid, FK) - Associated booking/order
  - `driver_id` (uuid, FK) - Assigned driver
  - `vehicle_id` (uuid, FK) - Assigned vehicle
  - `assignment_method` (text) - 'manual', 'auto', 'ai_recommended'
  - `assigned_at` (timestamptz) - When assignment was made
  - `assigned_by` (text) - Who made the assignment (admin/agent email or 'system')
  - `status` (text) - Assignment lifecycle status
  - `driver_accepted_at` (timestamptz, nullable) - Driver acceptance timestamp
  - `driver_arrived_at` (timestamptz, nullable) - Arrival at pickup
  - `pickup_completed_at` (timestamptz, nullable) - Customer picked up
  - `dropoff_completed_at` (timestamptz, nullable) - Trip completed
  - `cancelled_at` (timestamptz, nullable) - Assignment cancellation time
  - `cancellation_reason` (text, nullable) - Why assignment was cancelled
  - `notes` (text, nullable) - Dispatch notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `trip_logs` - Real-time trip event tracking
  Comprehensive event log for GPS tracking, status changes, and audit trail.
  
  **Columns:**
  - `id` (uuid, PK) - Unique log entry ID
  - `assignment_id` (uuid, FK) - Associated trip assignment
  - `event_type` (text) - Event category
  - `event_data` (jsonb) - Event details (location, metadata, etc.)
  - `timestamp` (timestamptz) - Event occurrence time
  - `created_at` (timestamptz)

  ### 3. `agent_users` - Dispatch agent management
  Separate from support agents - focused on booking management and dispatch.
  
  **Columns:**
  - `id` (uuid, PK) - Unique agent identifier
  - `email` (text, unique) - Login email
  - `name` (text) - Agent full name
  - `role` (text) - 'agent', 'senior_agent', 'dispatch_manager'
  - `permissions` (jsonb) - Granular permission flags
  - `status` (text) - 'active', 'inactive'
  - `created_at` (timestamptz)
  - `last_login` (timestamptz, nullable)

  ### 4. `invoices` - Formal billing records
  Proper invoicing system for completed trips and corporate billing.
  
  **Columns:**
  - `id` (uuid, PK) - Unique invoice identifier
  - `invoice_number` (text, unique) - Human-readable invoice number
  - `customer_id` (uuid, FK, nullable) - Individual customer
  - `corporate_account_id` (uuid, FK, nullable) - Corporate account
  - `booking_id` (uuid, FK, nullable) - Associated booking/trip
  - `assignment_id` (uuid, FK, nullable) - Associated trip assignment
  - `invoice_date` (date) - Invoice issue date
  - `due_date` (date) - Payment due date
  - `subtotal` (numeric) - Pre-tax amount
  - `tax_rate` (numeric) - Tax percentage
  - `tax_amount` (numeric) - Calculated tax
  - `total_amount` (numeric) - Final amount due
  - `amount_paid` (numeric) - Amount received
  - `status` (text) - Invoice payment status
  - `payment_method` (text, nullable) - How invoice was paid
  - `payment_date` (date, nullable) - When payment was received
  - `stripe_payment_id` (text, nullable) - Stripe transaction reference
  - `notes` (text, nullable) - Invoice notes
  - `line_items` (jsonb) - Detailed line items array
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Enhanced Bookings Table
  Updates the existing `bookings` table to integrate with CRM.

  **New Columns Added:**
  - `customer_id` (uuid, FK) - Link to customer CRM record
  - `quote_id` (uuid, FK) - Associated price quote
  - `pickup_address` (text) - Full pickup address
  - `dropoff_address` (text) - Full dropoff address
  - `pickup_datetime` (timestamptz) - Scheduled pickup time
  - `vehicle_type` (text) - Requested vehicle category
  - `passenger_count` (integer) - Number of passengers
  - `luggage_count` (integer) - Number of bags
  - `special_requests` (text, nullable) - Customer requests
  - `price` (numeric) - Final booking price
  - `payment_status` (text) - Payment state
  - `workflow_status` (text) - Extended status workflow
  - `updated_at` (timestamptz) - Last modification timestamp

  ## Security
  - RLS enabled on all tables
  - Admins: full access to all dispatch data
  - Agents: can manage assignments and view trips
  - Drivers: can view their own assignments and update status
  - Customers: can view their own invoices (future)

  ## Indexes
  - Assignment lookups by booking, driver, vehicle
  - Trip logs by assignment and timestamp
  - Invoices by customer, corporate account, status
  - Agent lookups by email
*/

-- =====================================================
-- ENHANCE BOOKINGS TABLE
-- =====================================================

-- Add CRM integration columns to existing bookings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'quote_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN quote_id uuid REFERENCES price_quotes(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'pickup_address'
  ) THEN
    ALTER TABLE bookings ADD COLUMN pickup_address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'dropoff_address'
  ) THEN
    ALTER TABLE bookings ADD COLUMN dropoff_address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'pickup_datetime'
  ) THEN
    ALTER TABLE bookings ADD COLUMN pickup_datetime timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'vehicle_type'
  ) THEN
    ALTER TABLE bookings ADD COLUMN vehicle_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'passenger_count'
  ) THEN
    ALTER TABLE bookings ADD COLUMN passenger_count integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'luggage_count'
  ) THEN
    ALTER TABLE bookings ADD COLUMN luggage_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'special_requests'
  ) THEN
    ALTER TABLE bookings ADD COLUMN special_requests text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'price'
  ) THEN
    ALTER TABLE bookings ADD COLUMN price numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'workflow_status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN workflow_status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE bookings ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_quote ON bookings(quote_id);
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_datetime ON bookings(pickup_datetime);
CREATE INDEX IF NOT EXISTS idx_bookings_workflow_status ON bookings(workflow_status);

-- =====================================================
-- TRIP ASSIGNMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS trip_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  assignment_method text DEFAULT 'manual' CHECK (assignment_method IN ('manual', 'auto', 'ai_recommended')),
  assigned_at timestamptz DEFAULT now(),
  assigned_by text,
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'en_route_pickup', 'arrived', 'in_progress', 'completed', 'cancelled')),
  driver_accepted_at timestamptz,
  driver_arrived_at timestamptz,
  pickup_completed_at timestamptz,
  dropoff_completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_assignments_booking ON trip_assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_trip_assignments_driver ON trip_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_trip_assignments_vehicle ON trip_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trip_assignments_status ON trip_assignments(status);
CREATE INDEX IF NOT EXISTS idx_trip_assignments_assigned_at ON trip_assignments(assigned_at DESC);

ALTER TABLE trip_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all assignments"
  ON trip_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Agents can manage assignments"
  ON trip_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_agents
      WHERE support_agents.email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Drivers can view own assignments"
  ON trip_assignments FOR SELECT
  TO authenticated
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Drivers can update own assignments"
  ON trip_assignments FOR UPDATE
  TO authenticated
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE email = auth.jwt()->>'email'
    )
  )
  WITH CHECK (
    driver_id IN (
      SELECT id FROM drivers WHERE email = auth.jwt()->>'email'
    )
  );

-- =====================================================
-- TRIP LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS trip_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES trip_assignments(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('location_update', 'status_change', 'message', 'photo', 'signature', 'delay', 'incident', 'note')),
  event_data jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_logs_assignment ON trip_logs(assignment_id);
CREATE INDEX IF NOT EXISTS idx_trip_logs_timestamp ON trip_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trip_logs_event_type ON trip_logs(event_type);

ALTER TABLE trip_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all trip logs"
  ON trip_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Agents can view trip logs"
  ON trip_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_agents
      WHERE support_agents.email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Drivers can create logs for own assignments"
  ON trip_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    assignment_id IN (
      SELECT ta.id FROM trip_assignments ta
      JOIN drivers d ON ta.driver_id = d.id
      WHERE d.email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Drivers can view own trip logs"
  ON trip_logs FOR SELECT
  TO authenticated
  USING (
    assignment_id IN (
      SELECT ta.id FROM trip_assignments ta
      JOIN drivers d ON ta.driver_id = d.id
      WHERE d.email = auth.jwt()->>'email'
    )
  );

-- =====================================================
-- AGENT USERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'agent' CHECK (role IN ('agent', 'senior_agent', 'dispatch_manager')),
  permissions jsonb DEFAULT '{"view_bookings": true, "create_bookings": true, "assign_drivers": true, "manage_customers": true}'::jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

CREATE INDEX IF NOT EXISTS idx_agent_users_email ON agent_users(email);
CREATE INDEX IF NOT EXISTS idx_agent_users_status ON agent_users(status);

ALTER TABLE agent_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage agents"
  ON agent_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Agents can view own profile"
  ON agent_users FOR SELECT
  TO authenticated
  USING (email = auth.jwt()->>'email');

-- =====================================================
-- INVOICES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  corporate_account_id uuid REFERENCES corporate_accounts(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  assignment_id uuid REFERENCES trip_assignments(id) ON DELETE SET NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_rate numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  amount_paid numeric DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')),
  payment_method text CHECK (payment_method IN ('card', 'bank_transfer', 'cash', 'corporate_billing', 'check')),
  payment_date date,
  stripe_payment_id text,
  notes text,
  line_items jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_corporate ON invoices(corporate_account_id);
CREATE INDEX IF NOT EXISTS idx_invoices_booking ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Agents can view and create invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_agents
      WHERE support_agents.email = auth.jwt()->>'email'
    ) OR EXISTS (
      SELECT 1 FROM agent_users
      WHERE agent_users.email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Agents can insert invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agent_users
      WHERE agent_users.email = auth.jwt()->>'email'
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Generate unique invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text AS $$
DECLARE
  new_number text;
  counter integer := 0;
BEGIN
  LOOP
    new_number := 'INV-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
    
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM invoices WHERE invoice_number = new_number
    );
    
    counter := counter + 1;
    IF counter > 100 THEN
      RAISE EXCEPTION 'Unable to generate unique invoice number';
    END IF;
  END LOOP;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Auto-generate invoice number on insert
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

CREATE TRIGGER trigger_set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_invoice_number();

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

CREATE TRIGGER trigger_update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_updated_at();

CREATE OR REPLACE FUNCTION update_trip_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

CREATE TRIGGER trigger_update_trip_assignments_updated_at
  BEFORE UPDATE ON trip_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_assignments_updated_at();

CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

CREATE TRIGGER trigger_update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();