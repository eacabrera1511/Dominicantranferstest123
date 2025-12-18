/*
  # Fix Pricing Rules Table for Admin Interface
  
  1. Changes
    - Add `route_name` column for user-friendly route identification
    - Add `origin` and `destination` columns for route endpoints
    - Add `vehicle_type_id` foreign key to vehicle_types table
    - Add `price_per_km` column for distance-based pricing
    - Add `surge_multiplier` column for surge pricing
    - Add `active` column (alias for is_active for compatibility)
    - Create indexes for better query performance
    
  2. Notes
    - Maintains backward compatibility with existing columns
    - Adds new columns with sensible defaults
*/

-- Add missing columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pricing_rules' AND column_name = 'route_name'
  ) THEN
    ALTER TABLE pricing_rules ADD COLUMN route_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pricing_rules' AND column_name = 'origin'
  ) THEN
    ALTER TABLE pricing_rules ADD COLUMN origin text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pricing_rules' AND column_name = 'destination'
  ) THEN
    ALTER TABLE pricing_rules ADD COLUMN destination text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pricing_rules' AND column_name = 'vehicle_type_id'
  ) THEN
    ALTER TABLE pricing_rules ADD COLUMN vehicle_type_id uuid REFERENCES vehicle_types(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pricing_rules' AND column_name = 'price_per_km'
  ) THEN
    ALTER TABLE pricing_rules ADD COLUMN price_per_km numeric DEFAULT 2.5;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pricing_rules' AND column_name = 'surge_multiplier'
  ) THEN
    ALTER TABLE pricing_rules ADD COLUMN surge_multiplier numeric DEFAULT 1.0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pricing_rules' AND column_name = 'active'
  ) THEN
    ALTER TABLE pricing_rules ADD COLUMN active boolean GENERATED ALWAYS AS (is_active) STORED;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pricing_rules_vehicle_type ON pricing_rules(vehicle_type_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_origin_dest ON pricing_rules(origin, destination);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(is_active) WHERE is_active = true;