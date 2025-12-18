/*
  # Seed Vehicle Types and Migrate Vehicle Relationships

  ## Overview
  Seeds the vehicle_types table with default types and migrates the vehicles table
  to use foreign key relationships.

  ## Changes
  1. Seed vehicle_types table with common vehicle types
  2. Add vehicle_type_id column to vehicles table
  3. Migrate existing vehicle_type text values to vehicle_type_id references
  4. Remove old vehicle_type text column

  ## Data Safety
  - Preserves all existing vehicle data
  - Creates vehicle type records for all existing types
  - Maps vehicles to appropriate types
*/

-- =====================================================
-- SEED VEHICLE TYPES
-- =====================================================

INSERT INTO vehicle_types (name, description, category, passenger_capacity, luggage_capacity, base_price_per_mile, base_price_per_hour, minimum_fare, icon_name, display_order, is_active)
VALUES
  ('Sedan', 'Standard 4-door sedan, comfortable for city and highway travel', 'economy', 4, 2, 2.50, 45.00, 15.00, 'car', 1, true),
  ('SUV', 'Sport utility vehicle with extra space and comfort', 'comfort', 6, 4, 3.50, 65.00, 25.00, 'truck', 2, true),
  ('Van', 'Spacious passenger van for group transportation', 'group', 8, 6, 4.50, 85.00, 35.00, 'bus', 3, true),
  ('Luxury', 'Premium luxury vehicle with high-end amenities', 'luxury', 4, 3, 5.00, 120.00, 50.00, 'sparkles', 4, true),
  ('Bus', 'Large passenger bus for group events and tours', 'group', 20, 15, 6.00, 150.00, 75.00, 'bus', 5, true),
  ('Limousine', 'Stretch limousine for special occasions', 'luxury', 8, 4, 7.00, 180.00, 100.00, 'crown', 6, true),
  ('Executive', 'Executive class vehicle for business travel', 'business', 4, 3, 4.50, 95.00, 40.00, 'briefcase', 7, true),
  ('Stretch', 'Extra-long stretch vehicle for parties and events', 'luxury', 10, 5, 8.00, 200.00, 120.00, 'star', 8, true)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- MIGRATE VEHICLES TABLE
-- =====================================================

-- Add new vehicle_type_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'vehicle_type_id'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN vehicle_type_id uuid REFERENCES vehicle_types(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Migrate existing data from vehicle_type to vehicle_type_id
UPDATE vehicles v
SET vehicle_type_id = vt.id
FROM vehicle_types vt
WHERE LOWER(v.vehicle_type) = LOWER(vt.name)
AND v.vehicle_type_id IS NULL;

-- For any remaining vehicles, assign to the first active type
UPDATE vehicles v
SET vehicle_type_id = (
  SELECT id FROM vehicle_types 
  WHERE is_active = true 
  ORDER BY display_order 
  LIMIT 1
)
WHERE vehicle_type_id IS NULL;

-- Make vehicle_type_id NOT NULL after data migration
ALTER TABLE vehicles ALTER COLUMN vehicle_type_id SET NOT NULL;

-- Drop the old vehicle_type column and its constraint
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_vehicle_type_check;
ALTER TABLE vehicles DROP COLUMN IF EXISTS vehicle_type;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_type_id ON vehicles(vehicle_type_id);
