/*
  # Fleet & Driver Management System

  ## Overview
  Complete fleet management system for vehicles and drivers with real-time availability,
  status tracking, and assignment capabilities.

  ## New Tables

  ### 1. `vehicles` - Fleet inventory management
  Central repository for all vehicles in the fleet with full specifications.
  
  **Columns:**
  - `id` (uuid, PK) - Unique vehicle identifier
  - `partner_id` (uuid, FK, nullable) - Owner partner (null = company-owned)
  - `vehicle_type` (text) - 'sedan', 'suv', 'van', 'luxury', 'bus', 'limousine'
  - `make` (text) - Vehicle manufacturer
  - `model` (text) - Vehicle model
  - `year` (integer) - Manufacturing year
  - `color` (text) - Vehicle color
  - `license_plate` (text, unique) - Registration plate number
  - `vin` (text, unique, nullable) - Vehicle identification number
  - `capacity` (integer) - Passenger capacity
  - `luggage_capacity` (integer) - Number of luggage pieces
  - `amenities` (jsonb) - Array of features (wifi, water, etc.)
  - `fuel_type` (text) - 'gasoline', 'diesel', 'electric', 'hybrid'
  - `status` (text) - 'available', 'in_service', 'maintenance', 'retired'
  - `current_location` (jsonb) - {lat, lng, address} for real-time tracking
  - `hourly_rate` (numeric) - Base hourly rental rate
  - `mileage` (integer) - Current odometer reading
  - `last_service_date` (date, nullable) - Most recent maintenance
  - `next_service_due` (date, nullable) - Upcoming maintenance due date
  - `insurance_expiry` (date, nullable) - Insurance policy expiration
  - `registration_expiry` (date, nullable) - Registration renewal date
  - `image_url` (text, nullable) - Vehicle photo
  - `notes` (text, nullable) - Internal notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `drivers` - Driver staff management
  Complete driver profiles with credentials, performance, and availability.
  
  **Columns:**
  - `id` (uuid, PK) - Unique driver identifier
  - `partner_id` (uuid, FK, nullable) - Employer partner (null = company employee)
  - `user_id` (uuid, nullable) - Link to auth.users for driver app login
  - `first_name` (text) - Driver first name
  - `last_name` (text) - Driver last name
  - `email` (text, unique) - Contact email
  - `phone` (text) - Contact phone number
  - `license_number` (text, unique) - Driver's license number
  - `license_expiry` (date) - License expiration date
  - `license_class` (text) - License type/class
  - `date_of_birth` (date) - Birth date for age verification
  - `hire_date` (date) - Employment start date
  - `status` (text) - 'active', 'on_break', 'off_duty', 'suspended', 'terminated'
  - `current_location` (jsonb) - {lat, lng, accuracy, timestamp} for dispatch
  - `rating` (numeric) - Average customer rating (0-5)
  - `total_trips` (integer) - Lifetime trip count
  - `languages` (jsonb) - Array of spoken languages
  - `vehicle_id` (uuid, FK, nullable) - Currently assigned vehicle
  - `emergency_contact_name` (text, nullable)
  - `emergency_contact_phone` (text, nullable)
  - `background_check_date` (date, nullable)
  - `background_check_status` (text) - 'pending', 'approved', 'failed'
  - `photo_url` (text, nullable) - Driver photo
  - `notes` (text, nullable) - Internal notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `driver_availability` - Schedule management
  Tracks driver work schedules and availability windows.
  
  **Columns:**
  - `id` (uuid, PK)
  - `driver_id` (uuid, FK) - Driver reference
  - `date` (date) - Availability date
  - `shift_start` (time) - Shift start time
  - `shift_end` (time) - Shift end time
  - `is_available` (boolean) - Available for assignments
  - `notes` (text, nullable) - Schedule notes
  - `created_at` (timestamptz)

  ### 4. `vehicle_maintenance_logs` - Service history
  Complete maintenance and repair history for compliance and planning.
  
  **Columns:**
  - `id` (uuid, PK)
  - `vehicle_id` (uuid, FK) - Vehicle reference
  - `maintenance_type` (text) - 'routine', 'repair', 'inspection', 'recall'
  - `description` (text) - Service description
  - `service_date` (date) - Date performed
  - `cost` (numeric) - Service cost
  - `mileage_at_service` (integer) - Odometer at service time
  - `performed_by` (text) - Service provider/mechanic
  - `next_service_mileage` (integer, nullable) - Next service due at mileage
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Admins: full access to all fleet data
  - Partners: can only see/manage their own vehicles and drivers
  - Agents: can view all vehicles/drivers for dispatch
  - Drivers: can view their own profile and update location

  ## Indexes
  - Vehicle license plate lookup (unique constraint already indexed)
  - Driver email lookup (unique constraint already indexed)
  - Vehicle status for availability queries
  - Driver status for dispatch queries
  - Vehicle partner_id for multi-tenant isolation
  - Driver availability by date range
*/

-- =====================================================
-- VEHICLES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners(id) ON DELETE SET NULL,
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('sedan', 'suv', 'van', 'luxury', 'bus', 'limousine', 'executive', 'stretch')),
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL CHECK (year >= 1990 AND year <= 2030),
  color text NOT NULL,
  license_plate text UNIQUE NOT NULL,
  vin text UNIQUE,
  capacity integer NOT NULL DEFAULT 4 CHECK (capacity > 0),
  luggage_capacity integer DEFAULT 2 CHECK (luggage_capacity >= 0),
  amenities jsonb DEFAULT '[]'::jsonb,
  fuel_type text DEFAULT 'gasoline' CHECK (fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid')),
  status text DEFAULT 'available' CHECK (status IN ('available', 'in_service', 'maintenance', 'retired')),
  current_location jsonb DEFAULT '{}'::jsonb,
  hourly_rate numeric DEFAULT 0,
  mileage integer DEFAULT 0,
  last_service_date date,
  next_service_due date,
  insurance_expiry date,
  registration_expiry date,
  image_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_partner ON vehicles(partner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(vehicle_type);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all vehicles"
  ON vehicles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Partners can manage their vehicles"
  ON vehicles FOR ALL
  TO authenticated
  USING (
    partner_id IN (
      SELECT id FROM partners
      WHERE partners.email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Agents can view all vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_agents
      WHERE support_agents.email = auth.jwt()->>'email'
    )
  );

-- =====================================================
-- DRIVERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners(id) ON DELETE SET NULL,
  user_id uuid,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  license_number text UNIQUE NOT NULL,
  license_expiry date NOT NULL,
  license_class text,
  date_of_birth date NOT NULL,
  hire_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'on_break', 'off_duty', 'suspended', 'terminated')),
  current_location jsonb DEFAULT '{}'::jsonb,
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_trips integer DEFAULT 0,
  languages jsonb DEFAULT '["en"]'::jsonb,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  emergency_contact_name text,
  emergency_contact_phone text,
  background_check_date date,
  background_check_status text DEFAULT 'pending' CHECK (background_check_status IN ('pending', 'approved', 'failed')),
  photo_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_partner ON drivers(partner_id);
CREATE INDEX IF NOT EXISTS idx_drivers_vehicle ON drivers(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all drivers"
  ON drivers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Partners can manage their drivers"
  ON drivers FOR ALL
  TO authenticated
  USING (
    partner_id IN (
      SELECT id FROM partners
      WHERE partners.email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Agents can view all drivers"
  ON drivers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_agents
      WHERE support_agents.email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Drivers can view own profile"
  ON drivers FOR SELECT
  TO authenticated
  USING (email = auth.jwt()->>'email');

CREATE POLICY "Drivers can update own location"
  ON drivers FOR UPDATE
  TO authenticated
  USING (email = auth.jwt()->>'email')
  WITH CHECK (email = auth.jwt()->>'email');

-- =====================================================
-- DRIVER AVAILABILITY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS driver_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  date date NOT NULL,
  shift_start time NOT NULL,
  shift_end time NOT NULL,
  is_available boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(driver_id, date)
);

CREATE INDEX IF NOT EXISTS idx_driver_availability_driver ON driver_availability(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_availability_date ON driver_availability(date);

ALTER TABLE driver_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage driver availability"
  ON driver_availability FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Partners can manage their drivers availability"
  ON driver_availability FOR ALL
  TO authenticated
  USING (
    driver_id IN (
      SELECT d.id FROM drivers d
      JOIN partners p ON d.partner_id = p.id
      WHERE p.email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Agents can view driver availability"
  ON driver_availability FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_agents
      WHERE support_agents.email = auth.jwt()->>'email'
    )
  );

-- =====================================================
-- VEHICLE MAINTENANCE LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS vehicle_maintenance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_type text NOT NULL CHECK (maintenance_type IN ('routine', 'repair', 'inspection', 'recall', 'cleaning')),
  description text NOT NULL,
  service_date date NOT NULL DEFAULT CURRENT_DATE,
  cost numeric DEFAULT 0,
  mileage_at_service integer,
  performed_by text,
  next_service_mileage integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_vehicle ON vehicle_maintenance_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_date ON vehicle_maintenance_logs(service_date DESC);

ALTER TABLE vehicle_maintenance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage maintenance logs"
  ON vehicle_maintenance_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Partners can manage their vehicle maintenance"
  ON vehicle_maintenance_logs FOR ALL
  TO authenticated
  USING (
    vehicle_id IN (
      SELECT v.id FROM vehicles v
      JOIN partners p ON v.partner_id = p.id
      WHERE p.email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Agents can view maintenance logs"
  ON vehicle_maintenance_logs FOR SELECT
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

-- Update vehicles.updated_at timestamp
CREATE OR REPLACE FUNCTION update_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

CREATE TRIGGER trigger_update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicles_updated_at();

-- Update drivers.updated_at timestamp
CREATE OR REPLACE FUNCTION update_drivers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

CREATE TRIGGER trigger_update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_drivers_updated_at();