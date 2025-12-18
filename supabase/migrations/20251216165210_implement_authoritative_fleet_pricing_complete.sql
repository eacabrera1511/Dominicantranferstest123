/*
  # Implement Authoritative Fleet and Pricing System - COMPLETE

  This migration implements the MASTER PROMPT fleet definitions and pricing rules
  for the Dominican Republic private transfer company.
*/

-- Clear existing data
DELETE FROM pricing_rules;
DELETE FROM vehicle_types;

-- Insert AUTHORITATIVE vehicle type definitions
INSERT INTO vehicle_types (name, description, passenger_capacity, luggage_capacity, minimum_fare, image_url, category, is_active, display_order) VALUES
('Sedan', 'Standard Private Transfer - Perfect for couples and solo travelers', 2, 3, 25.00, 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg', 'economy', true, 1),
('Minivan', 'Family Transfer - Ideal for families and small groups with luggage', 6, 8, 45.00, 'https://images.pexels.com/photos/2526128/pexels-photo-2526128.jpeg', 'comfort', true, 2),
('Suburban', 'Luxury SUV (VIP) - Executive black car service with premium comfort', 4, 4, 65.00, 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg', 'luxury', true, 3),
('Sprinter', 'Large Van - Premium group transport with ample luggage space', 12, 14, 110.00, 'https://images.pexels.com/photos/1860264/pexels-photo-1860264.jpeg', 'business', true, 4),
('Mini Bus', 'Mini Bus - Large group transportation with maximum capacity', 20, 25, 180.00, 'https://images.pexels.com/photos/1592119/pexels-photo-1592119.jpeg', 'group', true, 5);

-- Add zone column if needed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pricing_rules' AND column_name = 'zone') THEN
    ALTER TABLE pricing_rules ADD COLUMN zone TEXT;
  END IF;
END $$;

-- Insert pricing rules with proper rule_name
DO $$
DECLARE
  sedan_id UUID;  minivan_id UUID;  suburban_id UUID;  sprinter_id UUID;  minibus_id UUID;
BEGIN
  SELECT id INTO sedan_id FROM vehicle_types WHERE name = 'Sedan';
  SELECT id INTO minivan_id FROM vehicle_types WHERE name = 'Minivan';
  SELECT id INTO suburban_id FROM vehicle_types WHERE name = 'Suburban';
  SELECT id INTO sprinter_id FROM vehicle_types WHERE name = 'Sprinter';
  SELECT id INTO minibus_id FROM vehicle_types WHERE name = 'Mini Bus';

  -- Zone A PUJ
  INSERT INTO pricing_rules (rule_name, rule_type, route_name, origin, destination, vehicle_type_id, base_price, zone, is_active, priority) VALUES
  ('PUJ-PuntaCana-Sedan', 'zone_to_zone', 'PUJ to Punta Cana', 'PUJ', 'Punta Cana', sedan_id, 25.00, 'Zone A', true, 1),
  ('PUJ-PuntaCana-Minivan', 'zone_to_zone', 'PUJ to Punta Cana', 'PUJ', 'Punta Cana', minivan_id, 45.00, 'Zone A', true, 1),
  ('PUJ-PuntaCana-Suburban', 'zone_to_zone', 'PUJ to Punta Cana', 'PUJ', 'Punta Cana', suburban_id, 65.00, 'Zone A', true, 1),
  ('PUJ-PuntaCana-Sprinter', 'zone_to_zone', 'PUJ to Punta Cana', 'PUJ', 'Punta Cana', sprinter_id, 110.00, 'Zone A', true, 1),
  ('PUJ-PuntaCana-MiniBus', 'zone_to_zone', 'PUJ to Punta Cana', 'PUJ', 'Punta Cana', minibus_id, 180.00, 'Zone A', true, 1),
  ('PUJ-Bavaro-Sedan', 'zone_to_zone', 'PUJ to Bávaro', 'PUJ', 'Bávaro', sedan_id, 25.00, 'Zone A', true, 1),
  ('PUJ-Bavaro-Minivan', 'zone_to_zone', 'PUJ to Bávaro', 'PUJ', 'Bávaro', minivan_id, 45.00, 'Zone A', true, 1),
  ('PUJ-Bavaro-Suburban', 'zone_to_zone', 'PUJ to Bávaro', 'PUJ', 'Bávaro', suburban_id, 65.00, 'Zone A', true, 1),
  ('PUJ-Bavaro-Sprinter', 'zone_to_zone', 'PUJ to Bávaro', 'PUJ', 'Bávaro', sprinter_id, 110.00, 'Zone A', true, 1),
  ('PUJ-Bavaro-MiniBus', 'zone_to_zone', 'PUJ to Bávaro', 'PUJ', 'Bávaro', minibus_id, 180.00, 'Zone A', true, 1),
  -- Zone B PUJ
  ('PUJ-CapCana-Sedan', 'zone_to_zone', 'PUJ to Cap Cana', 'PUJ', 'Cap Cana', sedan_id, 30.00, 'Zone B', true, 1),
  ('PUJ-CapCana-Minivan', 'zone_to_zone', 'PUJ to Cap Cana', 'PUJ', 'Cap Cana', minivan_id, 50.00, 'Zone B', true, 1),
  ('PUJ-CapCana-Suburban', 'zone_to_zone', 'PUJ to Cap Cana', 'PUJ', 'Cap Cana', suburban_id, 75.00, 'Zone B', true, 1),
  ('PUJ-CapCana-Sprinter', 'zone_to_zone', 'PUJ to Cap Cana', 'PUJ', 'Cap Cana', sprinter_id, 120.00, 'Zone B', true, 1),
  ('PUJ-CapCana-MiniBus', 'zone_to_zone', 'PUJ to Cap Cana', 'PUJ', 'Cap Cana', minibus_id, 190.00, 'Zone B', true, 1),
  -- Zone C PUJ
  ('PUJ-UveroAlto-Sedan', 'zone_to_zone', 'PUJ to Uvero Alto', 'PUJ', 'Uvero Alto', sedan_id, 40.00, 'Zone C', true, 1),
  ('PUJ-UveroAlto-Minivan', 'zone_to_zone', 'PUJ to Uvero Alto', 'PUJ', 'Uvero Alto', minivan_id, 65.00, 'Zone C', true, 1),
  ('PUJ-UveroAlto-Suburban', 'zone_to_zone', 'PUJ to Uvero Alto', 'PUJ', 'Uvero Alto', suburban_id, 90.00, 'Zone C', true, 1),
  ('PUJ-UveroAlto-Sprinter', 'zone_to_zone', 'PUJ to Uvero Alto', 'PUJ', 'Uvero Alto', sprinter_id, 135.00, 'Zone C', true, 1),
  ('PUJ-UveroAlto-MiniBus', 'zone_to_zone', 'PUJ to Uvero Alto', 'PUJ', 'Uvero Alto', minibus_id, 210.00, 'Zone C', true, 1),
  ('PUJ-Macao-Sedan', 'zone_to_zone', 'PUJ to Macao', 'PUJ', 'Macao', sedan_id, 40.00, 'Zone C', true, 1),
  ('PUJ-Macao-Minivan', 'zone_to_zone', 'PUJ to Macao', 'PUJ', 'Macao', minivan_id, 65.00, 'Zone C', true, 1),
  ('PUJ-Macao-Suburban', 'zone_to_zone', 'PUJ to Macao', 'PUJ', 'Macao', suburban_id, 90.00, 'Zone C', true, 1),
  ('PUJ-Macao-Sprinter', 'zone_to_zone', 'PUJ to Macao', 'PUJ', 'Macao', sprinter_id, 135.00, 'Zone C', true, 1),
  ('PUJ-Macao-MiniBus', 'zone_to_zone', 'PUJ to Macao', 'PUJ', 'Macao', minibus_id, 210.00, 'Zone C', true, 1),
  -- Zone D PUJ
  ('PUJ-Bayahibe-Sedan', 'zone_to_zone', 'PUJ to Bayahibe', 'PUJ', 'Bayahibe', sedan_id, 55.00, 'Zone D', true, 1),
  ('PUJ-Bayahibe-Minivan', 'zone_to_zone', 'PUJ to Bayahibe', 'PUJ', 'Bayahibe', minivan_id, 80.00, 'Zone D', true, 1),
  ('PUJ-Bayahibe-Suburban', 'zone_to_zone', 'PUJ to Bayahibe', 'PUJ', 'Bayahibe', suburban_id, 110.00, 'Zone D', true, 1),
  ('PUJ-Bayahibe-Sprinter', 'zone_to_zone', 'PUJ to Bayahibe', 'PUJ', 'Bayahibe', sprinter_id, 160.00, 'Zone D', true, 1),
  ('PUJ-Bayahibe-MiniBus', 'zone_to_zone', 'PUJ to Bayahibe', 'PUJ', 'Bayahibe', minibus_id, 240.00, 'Zone D', true, 1),
  ('PUJ-LaRomana-Sedan', 'zone_to_zone', 'PUJ to La Romana', 'PUJ', 'La Romana', sedan_id, 55.00, 'Zone D', true, 1),
  ('PUJ-LaRomana-Minivan', 'zone_to_zone', 'PUJ to La Romana', 'PUJ', 'La Romana', minivan_id, 80.00, 'Zone D', true, 1),
  ('PUJ-LaRomana-Suburban', 'zone_to_zone', 'PUJ to La Romana', 'PUJ', 'La Romana', suburban_id, 110.00, 'Zone D', true, 1),
  ('PUJ-LaRomana-Sprinter', 'zone_to_zone', 'PUJ to La Romana', 'PUJ', 'La Romana', sprinter_id, 160.00, 'Zone D', true, 1),
  ('PUJ-LaRomana-MiniBus', 'zone_to_zone', 'PUJ to La Romana', 'PUJ', 'La Romana', minibus_id, 240.00, 'Zone D', true, 1),
  -- SDQ routes (Zone A-C)
  ('SDQ-PuntaCana-Sedan', 'zone_to_zone', 'SDQ to Punta Cana', 'SDQ', 'Punta Cana', sedan_id, 190.00, 'Zone A', true, 1),
  ('SDQ-PuntaCana-Minivan', 'zone_to_zone', 'SDQ to Punta Cana', 'SDQ', 'Punta Cana', minivan_id, 230.00, 'Zone A', true, 1),
  ('SDQ-PuntaCana-Suburban', 'zone_to_zone', 'SDQ to Punta Cana', 'SDQ', 'Punta Cana', suburban_id, 300.00, 'Zone A', true, 1),
  ('SDQ-PuntaCana-Sprinter', 'zone_to_zone', 'SDQ to Punta Cana', 'SDQ', 'Punta Cana', sprinter_id, 380.00, 'Zone A', true, 1),
  ('SDQ-PuntaCana-MiniBus', 'zone_to_zone', 'SDQ to Punta Cana', 'SDQ', 'Punta Cana', minibus_id, 520.00, 'Zone A', true, 1),
  ('SDQ-CapCana-Sedan', 'zone_to_zone', 'SDQ to Cap Cana', 'SDQ', 'Cap Cana', sedan_id, 200.00, 'Zone B', true, 1),
  ('SDQ-CapCana-Minivan', 'zone_to_zone', 'SDQ to Cap Cana', 'SDQ', 'Cap Cana', minivan_id, 250.00, 'Zone B', true, 1),
  ('SDQ-CapCana-Suburban', 'zone_to_zone', 'SDQ to Cap Cana', 'SDQ', 'Cap Cana', suburban_id, 320.00, 'Zone B', true, 1),
  ('SDQ-CapCana-Sprinter', 'zone_to_zone', 'SDQ to Cap Cana', 'SDQ', 'Cap Cana', sprinter_id, 400.00, 'Zone B', true, 1),
  ('SDQ-CapCana-MiniBus', 'zone_to_zone', 'SDQ to Cap Cana', 'SDQ', 'Cap Cana', minibus_id, 550.00, 'Zone B', true, 1),
  ('SDQ-UveroAlto-Sedan', 'zone_to_zone', 'SDQ to Uvero Alto', 'SDQ', 'Uvero Alto', sedan_id, 220.00, 'Zone C', true, 1),
  ('SDQ-UveroAlto-Minivan', 'zone_to_zone', 'SDQ to Uvero Alto', 'SDQ', 'Uvero Alto', minivan_id, 270.00, 'Zone C', true, 1),
  ('SDQ-UveroAlto-Suburban', 'zone_to_zone', 'SDQ to Uvero Alto', 'SDQ', 'Uvero Alto', suburban_id, 350.00, 'Zone C', true, 1),
  ('SDQ-UveroAlto-Sprinter', 'zone_to_zone', 'SDQ to Uvero Alto', 'SDQ', 'Uvero Alto', sprinter_id, 420.00, 'Zone C', true, 1),
  ('SDQ-UveroAlto-MiniBus', 'zone_to_zone', 'SDQ to Uvero Alto', 'SDQ', 'Uvero Alto', minibus_id, 580.00, 'Zone C', true, 1),
  -- PUJ-SDQ Direct
  ('PUJ-SDQ-Sedan', 'zone_to_zone', 'PUJ to SDQ', 'PUJ', 'SDQ', sedan_id, 220.00, 'Direct', true, 1),
  ('PUJ-SDQ-Minivan', 'zone_to_zone', 'PUJ to SDQ', 'PUJ', 'SDQ', minivan_id, 260.00, 'Direct', true, 1),
  ('PUJ-SDQ-Suburban', 'zone_to_zone', 'PUJ to SDQ', 'PUJ', 'SDQ', suburban_id, 320.00, 'Direct', true, 1),
  ('PUJ-SDQ-Sprinter', 'zone_to_zone', 'PUJ to SDQ', 'PUJ', 'SDQ', sprinter_id, 420.00, 'Direct', true, 1),
  ('PUJ-SDQ-MiniBus', 'zone_to_zone', 'PUJ to SDQ', 'PUJ', 'SDQ', minibus_id, 600.00, 'Direct', true, 1);
END $$;

-- Helper functions
CREATE OR REPLACE FUNCTION calculate_roundtrip_price(one_way_price DECIMAL) RETURNS DECIMAL AS $$ BEGIN RETURN one_way_price * 1.9; END; $$ LANGUAGE plpgsql IMMUTABLE;
CREATE OR REPLACE FUNCTION calculate_vip_price(base_price DECIMAL) RETURNS DECIMAL AS $$ BEGIN RETURN base_price * 1.35; END; $$ LANGUAGE plpgsql IMMUTABLE;
CREATE OR REPLACE FUNCTION auto_select_vehicle(passenger_count INTEGER, luggage_count INTEGER, is_vip BOOLEAN DEFAULT FALSE) RETURNS TEXT AS $$ BEGIN IF is_vip THEN RETURN 'Suburban'; END IF; IF passenger_count > 12 OR luggage_count > 14 THEN RETURN 'Mini Bus'; ELSIF passenger_count > 6 OR luggage_count > 8 THEN RETURN 'Sprinter'; ELSIF passenger_count > 2 OR luggage_count > 3 THEN RETURN 'Minivan'; ELSE RETURN 'Sedan'; END IF; END; $$ LANGUAGE plpgsql IMMUTABLE;

-- Zone table
CREATE TABLE IF NOT EXISTS transfer_zones (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), zone_code TEXT NOT NULL, zone_name TEXT NOT NULL, description TEXT, hotels TEXT[], created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
ALTER TABLE transfer_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read transfer zones" ON transfer_zones FOR SELECT TO public USING (true);

INSERT INTO transfer_zones (zone_code, zone_name, description, hotels) VALUES
('Zone A', 'Punta Cana / Bávaro', 'Main tourist area', ARRAY['Hard Rock Hotel Punta Cana', 'Barceló Bávaro Palace', 'Paradisus Palma Real', 'Majestic Elegance', 'Royalton Punta Cana', 'Dreams Punta Cana', 'Now Onyx', 'Breathless Punta Cana']),
('Zone B', 'Cap Cana', 'Luxury resort area', ARRAY['Secrets Cap Cana', 'Hyatt Zilara Cap Cana', 'Hyatt Ziva Cap Cana', 'Eden Roc Cap Cana', 'Fishing Lodge Cap Cana']),
('Zone C', 'Uvero Alto / Macao', 'Northern beach area', ARRAY['Excellence El Carmen', 'Zoetry Agua Punta Cana', 'Sivory Punta Cana', 'TRS Cap Cana']),
('Zone D', 'Bayahibe / La Romana', 'Southern coastal area', ARRAY['Dreams Dominicus', 'Hilton La Romana', 'Viva Wyndham Dominicus', 'Catalonia Gran Dominicus', 'Casa de Campo']),
('Zone E', 'Santo Domingo City', 'Capital city', ARRAY['JW Marriott Santo Domingo', 'Renaissance Santo Domingo', 'Sheraton Santo Domingo', 'InterContinental Real Santo Domingo']);
