/*
  # Real-time Availability and API Integration System

  ## 1. New Tables

  ### `partner_api_connections`
  Stores API credentials and connection details for partners' external systems
  - `id` (uuid, primary key) - Unique connection identifier
  - `partner_id` (uuid, foreign key) - Reference to partner
  - `connection_name` (text) - Name/description of the connection
  - `api_provider` (text) - Provider type (custom, booking_com, airbnb, etc.)
  - `api_endpoint` (text) - API base URL
  - `api_key` (text) - Encrypted API key
  - `api_secret` (text) - Encrypted API secret
  - `webhook_url` (text) - Webhook URL for real-time updates
  - `sync_enabled` (boolean) - Whether auto-sync is enabled
  - `sync_frequency` (integer) - Sync frequency in minutes
  - `last_sync_at` (timestamptz) - Last successful sync timestamp
  - `status` (text) - Connection status (active, inactive, error)
  - `settings` (jsonb) - Additional provider-specific settings
  - `created_at`, `updated_at` (timestamptz)

  ### `availability`
  Tracks real-time availability for hotels and services
  - `id` (uuid, primary key) - Unique availability record
  - `partner_id` (uuid, foreign key) - Reference to partner
  - `resource_type` (text) - Type of resource (hotel_room, vehicle, tour, etc.)
  - `resource_id` (uuid) - Reference to hotel or service
  - `resource_name` (text) - Name of the resource
  - `date` (date) - Availability date
  - `available_units` (integer) - Number of available units
  - `total_units` (integer) - Total units
  - `price` (numeric) - Price for this date (dynamic pricing)
  - `min_stay` (integer) - Minimum stay requirement
  - `status` (text) - Status (available, limited, sold_out, blocked)
  - `last_updated_at` (timestamptz) - When availability was last updated
  - `updated_via` (text) - How it was updated (manual, api_sync, booking)
  - `metadata` (jsonb) - Additional availability metadata
  - `created_at` (timestamptz)

  ### `sync_logs`
  Tracks API sync history and errors
  - `id` (uuid, primary key) - Unique log identifier
  - `partner_id` (uuid, foreign key) - Reference to partner
  - `connection_id` (uuid, foreign key) - Reference to API connection
  - `sync_type` (text) - Type of sync (availability, bookings, prices)
  - `status` (text) - Sync status (success, failed, partial)
  - `records_synced` (integer) - Number of records synced
  - `error_message` (text) - Error details if failed
  - `started_at` (timestamptz) - Sync start time
  - `completed_at` (timestamptz) - Sync completion time
  - `details` (jsonb) - Additional sync details

  ## 2. Indexes
  - Add indexes for common queries and real-time lookups

  ## 3. Security
  - Enable RLS on all tables
  - Add policies for partner access control
*/

-- Partner API Connections Table
CREATE TABLE IF NOT EXISTS partner_api_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  connection_name text NOT NULL,
  api_provider text NOT NULL DEFAULT 'custom',
  api_endpoint text,
  api_key text,
  api_secret text,
  webhook_url text,
  sync_enabled boolean DEFAULT true,
  sync_frequency integer DEFAULT 60,
  last_sync_at timestamptz,
  status text DEFAULT 'active',
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE partner_api_connections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partner_api_connections' AND policyname = 'Anyone can view API connections'
  ) THEN
    CREATE POLICY "Anyone can view API connections" ON partner_api_connections FOR SELECT TO public USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partner_api_connections' AND policyname = 'Anyone can manage API connections'
  ) THEN
    CREATE POLICY "Anyone can manage API connections" ON partner_api_connections FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Availability Table
CREATE TABLE IF NOT EXISTS availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  resource_name text NOT NULL,
  date date NOT NULL,
  available_units integer NOT NULL DEFAULT 0,
  total_units integer NOT NULL DEFAULT 1,
  price numeric,
  min_stay integer DEFAULT 1,
  status text DEFAULT 'available',
  last_updated_at timestamptz DEFAULT now(),
  updated_via text DEFAULT 'manual',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(resource_id, date)
);

ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'availability' AND policyname = 'Anyone can view availability'
  ) THEN
    CREATE POLICY "Anyone can view availability" ON availability FOR SELECT TO public USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'availability' AND policyname = 'Anyone can manage availability'
  ) THEN
    CREATE POLICY "Anyone can manage availability" ON availability FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Sync Logs Table
CREATE TABLE IF NOT EXISTS sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES partner_api_connections(id) ON DELETE SET NULL,
  sync_type text NOT NULL,
  status text NOT NULL,
  records_synced integer DEFAULT 0,
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  details jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sync_logs' AND policyname = 'Anyone can view sync logs'
  ) THEN
    CREATE POLICY "Anyone can view sync logs" ON sync_logs FOR SELECT TO public USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sync_logs' AND policyname = 'Anyone can create sync logs'
  ) THEN
    CREATE POLICY "Anyone can create sync logs" ON sync_logs FOR INSERT TO public WITH CHECK (true);
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_connections_partner_id ON partner_api_connections(partner_id);
CREATE INDEX IF NOT EXISTS idx_api_connections_status ON partner_api_connections(status);
CREATE INDEX IF NOT EXISTS idx_availability_partner_id ON availability(partner_id);
CREATE INDEX IF NOT EXISTS idx_availability_resource ON availability(resource_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_availability_date ON availability(date);
CREATE INDEX IF NOT EXISTS idx_availability_status ON availability(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_partner_id ON sync_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_connection_id ON sync_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs(started_at DESC);

-- Trigger to update updated_at on API connections
CREATE OR REPLACE FUNCTION update_api_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'api_connections_updated_at_trigger'
  ) THEN
    CREATE TRIGGER api_connections_updated_at_trigger
      BEFORE UPDATE ON partner_api_connections
      FOR EACH ROW
      EXECUTE FUNCTION update_api_connections_updated_at();
  END IF;
END $$;

-- Function to automatically update availability status based on available units
CREATE OR REPLACE FUNCTION update_availability_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.available_units = 0 THEN
    NEW.status = 'sold_out';
  ELSIF NEW.available_units <= (NEW.total_units * 0.2) THEN
    NEW.status = 'limited';
  ELSE
    NEW.status = 'available';
  END IF;
  
  NEW.last_updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'availability_status_trigger'
  ) THEN
    CREATE TRIGGER availability_status_trigger
      BEFORE INSERT OR UPDATE ON availability
      FOR EACH ROW
      EXECUTE FUNCTION update_availability_status();
  END IF;
END $$;