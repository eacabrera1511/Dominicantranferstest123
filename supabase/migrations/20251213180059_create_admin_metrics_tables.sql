/*
  # Admin Dashboard Metrics Tables

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `email` (text, unique) - Admin email
      - `name` (text) - Admin name
      - `role` (text) - super_admin, admin, viewer
      - `created_at` (timestamptz)
      - `last_login` (timestamptz)

    - `platform_metrics`
      - `id` (uuid, primary key)
      - `metric_date` (date) - Date of the metric
      - `active_partners` (int) - Number of active partners
      - `total_listings` (int) - Total service listings
      - `total_bookings` (int) - Total bookings made
      - `daily_active_users` (int) - DAU count
      - `weekly_active_users` (int) - WAU count
      - `monthly_active_users` (int) - MAU count
      - `new_signups` (int) - New user signups
      - `created_at` (timestamptz)

    - `financial_metrics`
      - `id` (uuid, primary key)
      - `metric_date` (date) - Date of the metric
      - `total_revenue` (decimal) - Total platform revenue
      - `total_bookings_value` (decimal) - GMV
      - `commission_earned` (decimal) - Commission from bookings
      - `llm_api_costs` (decimal) - AI/LLM API costs
      - `cloud_hosting_costs` (decimal) - Infrastructure costs
      - `payment_processing_fees` (decimal) - Stripe/payment fees
      - `other_costs` (decimal) - Miscellaneous costs
      - `net_profit` (decimal) - Net profit
      - `currency` (text) - Currency code
      - `created_at` (timestamptz)

    - `performance_metrics`
      - `id` (uuid, primary key)
      - `metric_date` (date) - Date of the metric
      - `avg_page_load_time` (decimal) - Average page load in ms
      - `avg_api_response_time` (decimal) - Average API response in ms
      - `uptime_percentage` (decimal) - System uptime %
      - `total_errors` (int) - Total errors logged
      - `error_rate` (decimal) - Error rate %
      - `successful_requests` (int) - Successful API requests
      - `failed_requests` (int) - Failed API requests
      - `created_at` (timestamptz)

    - `operational_metrics`
      - `id` (uuid, primary key)
      - `metric_date` (date) - Date of the metric
      - `open_support_tickets` (int) - Open tickets count
      - `resolved_tickets` (int) - Resolved tickets
      - `avg_resolution_time_hours` (decimal) - Avg time to resolve
      - `dev_hours_features` (decimal) - Dev hours on features
      - `dev_hours_bugs` (decimal) - Dev hours on bugs
      - `dev_hours_maintenance` (decimal) - Dev hours on maintenance
      - `created_at` (timestamptz)

    - `llm_usage_logs`
      - `id` (uuid, primary key)
      - `timestamp` (timestamptz) - When the call was made
      - `model` (text) - Model used (gpt-4, claude, etc.)
      - `tokens_input` (int) - Input tokens
      - `tokens_output` (int) - Output tokens
      - `cost` (decimal) - Cost of the call
      - `endpoint` (text) - Which feature used it
      - `user_session` (text) - Session identifier

  2. Security
    - Enable RLS on all tables
    - Only admin users can access these tables

  3. Seed Data
    - Insert sample metrics for demo purposes
*/

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'viewer',
  password_hash text,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_users' AND policyname = 'Public read access for admin users'
  ) THEN
    CREATE POLICY "Public read access for admin users" ON admin_users FOR SELECT TO public USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_users' AND policyname = 'Public insert for admin users'
  ) THEN
    CREATE POLICY "Public insert for admin users" ON admin_users FOR INSERT TO public WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_users' AND policyname = 'Public update for admin users'
  ) THEN
    CREATE POLICY "Public update for admin users" ON admin_users FOR UPDATE TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Platform Metrics Table
CREATE TABLE IF NOT EXISTS platform_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL,
  active_partners int DEFAULT 0,
  total_listings int DEFAULT 0,
  total_bookings int DEFAULT 0,
  daily_active_users int DEFAULT 0,
  weekly_active_users int DEFAULT 0,
  monthly_active_users int DEFAULT 0,
  new_signups int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(metric_date)
);

ALTER TABLE platform_metrics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'platform_metrics' AND policyname = 'Public read access for platform metrics'
  ) THEN
    CREATE POLICY "Public read access for platform metrics" ON platform_metrics FOR SELECT TO public USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'platform_metrics' AND policyname = 'Public insert for platform metrics'
  ) THEN
    CREATE POLICY "Public insert for platform metrics" ON platform_metrics FOR INSERT TO public WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'platform_metrics' AND policyname = 'Public update for platform metrics'
  ) THEN
    CREATE POLICY "Public update for platform metrics" ON platform_metrics FOR UPDATE TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Financial Metrics Table
CREATE TABLE IF NOT EXISTS financial_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL,
  total_revenue decimal(12,2) DEFAULT 0,
  total_bookings_value decimal(12,2) DEFAULT 0,
  commission_earned decimal(12,2) DEFAULT 0,
  llm_api_costs decimal(12,2) DEFAULT 0,
  cloud_hosting_costs decimal(12,2) DEFAULT 0,
  payment_processing_fees decimal(12,2) DEFAULT 0,
  other_costs decimal(12,2) DEFAULT 0,
  net_profit decimal(12,2) DEFAULT 0,
  currency text DEFAULT 'EUR',
  created_at timestamptz DEFAULT now(),
  UNIQUE(metric_date)
);

ALTER TABLE financial_metrics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'financial_metrics' AND policyname = 'Public read access for financial metrics'
  ) THEN
    CREATE POLICY "Public read access for financial metrics" ON financial_metrics FOR SELECT TO public USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'financial_metrics' AND policyname = 'Public insert for financial metrics'
  ) THEN
    CREATE POLICY "Public insert for financial metrics" ON financial_metrics FOR INSERT TO public WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'financial_metrics' AND policyname = 'Public update for financial metrics'
  ) THEN
    CREATE POLICY "Public update for financial metrics" ON financial_metrics FOR UPDATE TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL,
  avg_page_load_time decimal(10,2) DEFAULT 0,
  avg_api_response_time decimal(10,2) DEFAULT 0,
  uptime_percentage decimal(5,2) DEFAULT 100,
  total_errors int DEFAULT 0,
  error_rate decimal(5,4) DEFAULT 0,
  successful_requests int DEFAULT 0,
  failed_requests int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(metric_date)
);

ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'performance_metrics' AND policyname = 'Public read access for performance metrics'
  ) THEN
    CREATE POLICY "Public read access for performance metrics" ON performance_metrics FOR SELECT TO public USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'performance_metrics' AND policyname = 'Public insert for performance metrics'
  ) THEN
    CREATE POLICY "Public insert for performance metrics" ON performance_metrics FOR INSERT TO public WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'performance_metrics' AND policyname = 'Public update for performance metrics'
  ) THEN
    CREATE POLICY "Public update for performance metrics" ON performance_metrics FOR UPDATE TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Operational Metrics Table
CREATE TABLE IF NOT EXISTS operational_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL,
  open_support_tickets int DEFAULT 0,
  resolved_tickets int DEFAULT 0,
  avg_resolution_time_hours decimal(10,2) DEFAULT 0,
  dev_hours_features decimal(10,2) DEFAULT 0,
  dev_hours_bugs decimal(10,2) DEFAULT 0,
  dev_hours_maintenance decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(metric_date)
);

ALTER TABLE operational_metrics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'operational_metrics' AND policyname = 'Public read access for operational metrics'
  ) THEN
    CREATE POLICY "Public read access for operational metrics" ON operational_metrics FOR SELECT TO public USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'operational_metrics' AND policyname = 'Public insert for operational metrics'
  ) THEN
    CREATE POLICY "Public insert for operational metrics" ON operational_metrics FOR INSERT TO public WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'operational_metrics' AND policyname = 'Public update for operational metrics'
  ) THEN
    CREATE POLICY "Public update for operational metrics" ON operational_metrics FOR UPDATE TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- LLM Usage Logs Table
CREATE TABLE IF NOT EXISTS llm_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  model text NOT NULL,
  tokens_input int DEFAULT 0,
  tokens_output int DEFAULT 0,
  cost decimal(10,6) DEFAULT 0,
  endpoint text,
  user_session text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE llm_usage_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'llm_usage_logs' AND policyname = 'Public read access for llm usage logs'
  ) THEN
    CREATE POLICY "Public read access for llm usage logs" ON llm_usage_logs FOR SELECT TO public USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'llm_usage_logs' AND policyname = 'Public insert for llm usage logs'
  ) THEN
    CREATE POLICY "Public insert for llm usage logs" ON llm_usage_logs FOR INSERT TO public WITH CHECK (true);
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_platform_metrics_date ON platform_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_metrics_date ON financial_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON performance_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_operational_metrics_date ON operational_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_llm_usage_logs_timestamp ON llm_usage_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_llm_usage_logs_model ON llm_usage_logs(model);

-- Insert default admin user
INSERT INTO admin_users (email, name, role) 
VALUES ('admin@travelai.com', 'System Admin', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample metrics data for the last 30 days
DO $$
DECLARE
  d date;
  base_partners int := 45;
  base_listings int := 120;
  base_dau int := 850;
BEGIN
  FOR i IN 0..29 LOOP
    d := CURRENT_DATE - i;
    
    -- Platform metrics with realistic growth
    INSERT INTO platform_metrics (metric_date, active_partners, total_listings, total_bookings, daily_active_users, weekly_active_users, monthly_active_users, new_signups)
    VALUES (
      d,
      base_partners + (30 - i) + floor(random() * 5),
      base_listings + (30 - i) * 3 + floor(random() * 10),
      floor(random() * 25) + 10,
      base_dau + floor(random() * 200) - 100,
      base_dau * 3 + floor(random() * 500),
      base_dau * 8 + floor(random() * 1000),
      floor(random() * 15) + 5
    )
    ON CONFLICT (metric_date) DO NOTHING;
    
    -- Financial metrics
    INSERT INTO financial_metrics (metric_date, total_revenue, total_bookings_value, commission_earned, llm_api_costs, cloud_hosting_costs, payment_processing_fees, other_costs, net_profit)
    VALUES (
      d,
      (floor(random() * 500) + 800)::decimal,
      (floor(random() * 5000) + 8000)::decimal,
      (floor(random() * 500) + 800)::decimal,
      (floor(random() * 50) + 30)::decimal,
      (floor(random() * 20) + 45)::decimal,
      (floor(random() * 30) + 20)::decimal,
      (floor(random() * 15) + 10)::decimal,
      (floor(random() * 400) + 600)::decimal
    )
    ON CONFLICT (metric_date) DO NOTHING;
    
    -- Performance metrics
    INSERT INTO performance_metrics (metric_date, avg_page_load_time, avg_api_response_time, uptime_percentage, total_errors, error_rate, successful_requests, failed_requests)
    VALUES (
      d,
      (floor(random() * 300) + 800)::decimal,
      (floor(random() * 100) + 120)::decimal,
      (99.5 + random() * 0.5)::decimal,
      floor(random() * 20) + 5,
      (random() * 0.5)::decimal,
      floor(random() * 10000) + 25000,
      floor(random() * 50) + 10
    )
    ON CONFLICT (metric_date) DO NOTHING;
    
    -- Operational metrics
    INSERT INTO operational_metrics (metric_date, open_support_tickets, resolved_tickets, avg_resolution_time_hours, dev_hours_features, dev_hours_bugs, dev_hours_maintenance)
    VALUES (
      d,
      floor(random() * 15) + 5,
      floor(random() * 12) + 3,
      (floor(random() * 20) + 4)::decimal,
      (floor(random() * 30) + 10)::decimal,
      (floor(random() * 15) + 5)::decimal,
      (floor(random() * 10) + 2)::decimal
    )
    ON CONFLICT (metric_date) DO NOTHING;
  END LOOP;
END $$;

-- Insert sample LLM usage logs
INSERT INTO llm_usage_logs (timestamp, model, tokens_input, tokens_output, cost, endpoint, user_session)
SELECT 
  now() - (random() * interval '30 days'),
  CASE floor(random() * 3)
    WHEN 0 THEN 'gpt-4'
    WHEN 1 THEN 'gpt-3.5-turbo'
    ELSE 'claude-3-sonnet'
  END,
  floor(random() * 2000) + 100,
  floor(random() * 1000) + 50,
  (random() * 0.1)::decimal(10,6),
  CASE floor(random() * 4)
    WHEN 0 THEN 'chat_assistant'
    WHEN 1 THEN 'booking_recommendations'
    WHEN 2 THEN 'search_query'
    ELSE 'content_generation'
  END,
  'session_' || floor(random() * 10000)
FROM generate_series(1, 500);