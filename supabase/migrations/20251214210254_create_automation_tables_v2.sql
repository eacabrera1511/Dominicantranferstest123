/*
  # CRM Automation Support Tables

  ## Overview
  Creates all supporting tables needed for CRM automations including payment tracking,
  review requests, admin notifications, partner payouts, and activity logging.

  ## New Tables

  ### 1. `payment_transactions` - Payment history and tracking
  ### 2. `review_requests` - Customer review management
  ### 3. `admin_notifications` - Internal alert system
  ### 4. `partner_daily_stats` - Partner performance metrics
  ### 5. `partner_payouts` - Payout batch management
  ### 6. `partner_transactions` - Partner commission tracking
  ### 7. `customer_activity_log` - Customer interaction history
  ### 8. `automation_logs` - Automation execution tracking
  ### 9. `automation_errors` - Failed automation queue

  ## Security
  - RLS enabled on all tables
  - Partners can only view own stats and payouts
  - Customers can view own activity log
  - Admins have full access
*/

-- =====================================================
-- PAYMENT TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  payment_method text CHECK (payment_method IN ('stripe', 'card', 'cash', 'bank_transfer', 'corporate_billing', 'penalty')),
  stripe_payment_id text,
  transaction_type text DEFAULT 'booking_payment' CHECK (transaction_type IN ('booking_payment', 'refund', 'no_show_fee', 'cancellation_fee', 'adjustment')),
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_date timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking ON payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer ON payment_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON payment_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe ON payment_transactions(stripe_payment_id);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment transactions"
  ON payment_transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Customers can view own transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE email = auth.jwt()->>'email'
    )
  );

-- =====================================================
-- REVIEW REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reminder_sent boolean DEFAULT false,
  expires_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_requests_booking ON review_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_customer ON review_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_status ON review_requests(status);
CREATE INDEX IF NOT EXISTS idx_review_requests_expires ON review_requests(expires_at);

ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage review requests"
  ON review_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Customers can view own review requests"
  ON review_requests FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE email = auth.jwt()->>'email'
    )
  );

-- =====================================================
-- ADMIN NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('new_booking', 'payment_received', 'no_show_detected', 'unassigned_booking', 'customer_complaint', 'driver_issue', 'system_alert')),
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  read boolean DEFAULT false,
  read_by text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority ON admin_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON admin_notifications(created_at DESC);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notifications"
  ON admin_notifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Agents can view notifications"
  ON admin_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agent_users
      WHERE agent_users.email = auth.jwt()->>'email'
    )
  );

-- =====================================================
-- PARTNER TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS partner_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('commission_pending', 'commission_approved', 'payout', 'adjustment', 'refund')),
  amount numeric NOT NULL,
  platform_fee numeric DEFAULT 0,
  net_amount numeric GENERATED ALWAYS AS (amount - platform_fee) STORED,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  transaction_date timestamptz DEFAULT now(),
  approved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_transactions_partner ON partner_transactions(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_transactions_booking ON partner_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_partner_transactions_status ON partner_transactions(status);
CREATE INDEX IF NOT EXISTS idx_partner_transactions_date ON partner_transactions(transaction_date DESC);

ALTER TABLE partner_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage partner transactions"
  ON partner_transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Partners can view own transactions"
  ON partner_transactions FOR SELECT
  TO authenticated
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE email = auth.jwt()->>'email'
    )
  );

-- =====================================================
-- PARTNER PAYOUTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS partner_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  payout_date date NOT NULL,
  amount numeric NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  included_transactions jsonb DEFAULT '[]'::jsonb,
  stripe_payout_id text,
  paid_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_payouts_partner ON partner_payouts(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_status ON partner_payouts(status);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_date ON partner_payouts(payout_date DESC);

ALTER TABLE partner_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payouts"
  ON partner_payouts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Partners can view own payouts"
  ON partner_payouts FOR SELECT
  TO authenticated
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE email = auth.jwt()->>'email'
    )
  );

-- Link partner_transactions to payouts
ALTER TABLE partner_transactions ADD COLUMN IF NOT EXISTS payout_id uuid REFERENCES partner_payouts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_partner_transactions_payout ON partner_transactions(payout_id);

-- =====================================================
-- PARTNER DAILY STATS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS partner_daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  date date NOT NULL,
  bookings_count integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  commission_earned numeric DEFAULT 0,
  platform_fees numeric DEFAULT 0,
  net_earnings numeric GENERATED ALWAYS AS (commission_earned - platform_fees) STORED,
  created_at timestamptz DEFAULT now(),
  UNIQUE(partner_id, date)
);

CREATE INDEX IF NOT EXISTS idx_partner_daily_stats_partner ON partner_daily_stats(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_daily_stats_date ON partner_daily_stats(date DESC);

ALTER TABLE partner_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all partner stats"
  ON partner_daily_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Partners can view own stats"
  ON partner_daily_stats FOR SELECT
  TO authenticated
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE email = auth.jwt()->>'email'
    )
  );

-- =====================================================
-- CUSTOMER ACTIVITY LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('booking_created', 'payment_received', 'trip_completed', 'review_submitted', 'no_show', 'cancellation', 'profile_updated', 'support_ticket')),
  details jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  timestamp timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_activity_customer ON customer_activity_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activity_type ON customer_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_customer_activity_timestamp ON customer_activity_log(timestamp DESC);

ALTER TABLE customer_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all activity logs"
  ON customer_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Customers can view own activity"
  ON customer_activity_log FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "System can log activity"
  ON customer_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- AUTOMATION LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_name text NOT NULL,
  trigger_type text NOT NULL CHECK (trigger_type IN ('database_event', 'scheduled', 'manual', 'webhook')),
  execution_status text NOT NULL CHECK (execution_status IN ('running', 'success', 'failed', 'partial')),
  records_processed integer DEFAULT 0,
  errors_count integer DEFAULT 0,
  execution_time_ms integer,
  error_details jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_name ON automation_logs(automation_name);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON automation_logs(execution_status);
CREATE INDEX IF NOT EXISTS idx_automation_logs_started ON automation_logs(started_at DESC);

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view automation logs"
  ON automation_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "System can log automations"
  ON automation_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- AUTOMATION ERRORS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS automation_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_name text NOT NULL,
  payload jsonb NOT NULL,
  error_message text,
  error_stack text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  status text DEFAULT 'failed' CHECK (status IN ('failed', 'retrying', 'resolved', 'abandoned')),
  last_retry_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_errors_name ON automation_errors(automation_name);
CREATE INDEX IF NOT EXISTS idx_automation_errors_status ON automation_errors(status);
CREATE INDEX IF NOT EXISTS idx_automation_errors_retry ON automation_errors(retry_count, status);

ALTER TABLE automation_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage automation errors"
  ON automation_errors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "System can log errors"
  ON automation_errors FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- ADD AUTOMATION TRACKING TO BOOKINGS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'reminder_sent_24h'
  ) THEN
    ALTER TABLE bookings ADD COLUMN reminder_sent_24h boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'reminder_sent_2h'
  ) THEN
    ALTER TABLE bookings ADD COLUMN reminder_sent_2h boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'completion_email_sent'
  ) THEN
    ALTER TABLE bookings ADD COLUMN completion_email_sent boolean DEFAULT false;
  END IF;
END $$;
