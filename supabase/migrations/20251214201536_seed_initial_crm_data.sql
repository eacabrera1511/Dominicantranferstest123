/*
  # Seed Initial CRM Data

  ## Overview
  Populates the system with essential data to make it immediately operational:
  - Pricing zones for major airports and cities
  - Base pricing rules for all vehicle types
  - Sample vehicles and drivers for testing
  - Agent user account

  ## Data Created
  
  ### Pricing Zones (8 zones)
  - JFK Airport, LaGuardia Airport, Newark Airport
  - Manhattan, Brooklyn, Queens
  - Jersey City, Long Island
  
  ### Pricing Rules (6 rules)
  - Base rates for each vehicle type
  - Distance-based pricing
  - Peak hour multipliers
  - Airport zone-to-zone flat rates
  
  ### Sample Fleet (5 vehicles)
  - 2 Sedans, 1 SUV, 1 Van, 1 Luxury
  
  ### Sample Drivers (3 drivers)
  - Mix of experienced drivers with good ratings
  
  ### Agent User (1 agent)
  - Demo agent for testing dispatch operations

  ## Note
  This is seed data for development/demo. In production, this would be
  populated through the admin interface.
*/

-- =====================================================
-- PRICING ZONES
-- =====================================================

INSERT INTO pricing_zones (zone_name, zone_code, zone_type, center_point, boundary, is_active) VALUES
  ('JFK Airport', 'JFK', 'airport', '{"lat": 40.6413, "lng": -73.7781}'::jsonb, '{"type": "circle", "radius": 2}'::jsonb, true),
  ('LaGuardia Airport', 'LGA', 'airport', '{"lat": 40.7769, "lng": -73.8740}'::jsonb, '{"type": "circle", "radius": 2}'::jsonb, true),
  ('Newark Airport', 'EWR', 'airport', '{"lat": 40.6895, "lng": -74.1745}'::jsonb, '{"type": "circle", "radius": 2}'::jsonb, true),
  ('Manhattan', 'MHT', 'city_center', '{"lat": 40.7580, "lng": -73.9855}'::jsonb, '{"type": "circle", "radius": 5}'::jsonb, true),
  ('Brooklyn', 'BKN', 'city_center', '{"lat": 40.6782, "lng": -73.9442}'::jsonb, '{"type": "circle", "radius": 5}'::jsonb, true),
  ('Queens', 'QNS', 'suburb', '{"lat": 40.7282, "lng": -73.7949}'::jsonb, '{"type": "circle", "radius": 5}'::jsonb, true),
  ('Jersey City', 'JC', 'suburb', '{"lat": 40.7178, "lng": -74.0431}'::jsonb, '{"type": "circle", "radius": 3}'::jsonb, true),
  ('Long Island', 'LI', 'suburb', '{"lat": 40.7891, "lng": -73.1350}'::jsonb, '{"type": "circle", "radius": 10}'::jsonb, true)
ON CONFLICT (zone_code) DO NOTHING;

-- =====================================================
-- PRICING RULES
-- =====================================================

-- Base rates for different vehicle types
INSERT INTO pricing_rules (
  rule_name, rule_type, priority, is_active, vehicle_types, 
  base_price, minimum_charge
) VALUES
  ('Sedan Base Rate', 'base_rate', 10, true, '["sedan"]'::jsonb, 15.00, 25.00),
  ('SUV Base Rate', 'base_rate', 10, true, '["suv"]'::jsonb, 20.00, 35.00),
  ('Van Base Rate', 'base_rate', 10, true, '["van"]'::jsonb, 25.00, 45.00),
  ('Luxury Base Rate', 'base_rate', 10, true, '["luxury", "executive"]'::jsonb, 35.00, 60.00),
  ('Limousine Base Rate', 'base_rate', 10, true, '["limousine", "stretch"]'::jsonb, 50.00, 100.00)
ON CONFLICT DO NOTHING;

-- Distance-based pricing
INSERT INTO pricing_rules (
  rule_name, rule_type, priority, is_active, vehicle_types,
  price_per_mile
) VALUES
  ('Sedan Per Mile', 'distance', 20, true, '["sedan"]'::jsonb, 2.50),
  ('SUV Per Mile', 'distance', 20, true, '["suv"]'::jsonb, 3.00),
  ('Van Per Mile', 'distance', 20, true, '["van"]'::jsonb, 3.50),
  ('Luxury Per Mile', 'distance', 20, true, '["luxury", "executive"]'::jsonb, 4.50),
  ('Limousine Per Mile', 'distance', 20, true, '["limousine", "stretch"]'::jsonb, 6.00)
ON CONFLICT DO NOTHING;

-- Peak hour multipliers (weekdays 7-9 AM and 5-7 PM)
INSERT INTO pricing_rules (
  rule_name, rule_type, priority, is_active,
  time_multiplier, day_of_week, time_range_start, time_range_end
) VALUES
  ('Morning Rush Hour', 'time_multiplier', 30, true, 1.25, '[1,2,3,4,5]'::jsonb, '07:00', '09:00'),
  ('Evening Rush Hour', 'time_multiplier', 30, true, 1.25, '[1,2,3,4,5]'::jsonb, '17:00', '19:00')
ON CONFLICT DO NOTHING;

-- Airport zone-to-zone flat rates (JFK to Manhattan)
DO $$
DECLARE
  jfk_zone_id uuid;
  lga_zone_id uuid;
  ewr_zone_id uuid;
  mht_zone_id uuid;
BEGIN
  SELECT id INTO jfk_zone_id FROM pricing_zones WHERE zone_code = 'JFK';
  SELECT id INTO lga_zone_id FROM pricing_zones WHERE zone_code = 'LGA';
  SELECT id INTO ewr_zone_id FROM pricing_zones WHERE zone_code = 'EWR';
  SELECT id INTO mht_zone_id FROM pricing_zones WHERE zone_code = 'MHT';

  IF jfk_zone_id IS NOT NULL AND mht_zone_id IS NOT NULL THEN
    INSERT INTO pricing_rules (
      rule_name, rule_type, priority, is_active, vehicle_types,
      from_zone_id, to_zone_id, base_price
    ) VALUES
      ('JFK to Manhattan - Sedan', 'zone_to_zone', 5, true, '["sedan"]'::jsonb, jfk_zone_id, mht_zone_id, 75.00),
      ('JFK to Manhattan - SUV', 'zone_to_zone', 5, true, '["suv"]'::jsonb, jfk_zone_id, mht_zone_id, 95.00),
      ('JFK to Manhattan - Luxury', 'zone_to_zone', 5, true, '["luxury"]'::jsonb, jfk_zone_id, mht_zone_id, 125.00),
      ('Manhattan to JFK - Sedan', 'zone_to_zone', 5, true, '["sedan"]'::jsonb, mht_zone_id, jfk_zone_id, 75.00),
      ('Manhattan to JFK - SUV', 'zone_to_zone', 5, true, '["suv"]'::jsonb, mht_zone_id, jfk_zone_id, 95.00),
      ('Manhattan to JFK - Luxury', 'zone_to_zone', 5, true, '["luxury"]'::jsonb, mht_zone_id, jfk_zone_id, 125.00)
    ON CONFLICT DO NOTHING;
  END IF;

  IF lga_zone_id IS NOT NULL AND mht_zone_id IS NOT NULL THEN
    INSERT INTO pricing_rules (
      rule_name, rule_type, priority, is_active, vehicle_types,
      from_zone_id, to_zone_id, base_price
    ) VALUES
      ('LGA to Manhattan - Sedan', 'zone_to_zone', 5, true, '["sedan"]'::jsonb, lga_zone_id, mht_zone_id, 65.00),
      ('Manhattan to LGA - Sedan', 'zone_to_zone', 5, true, '["sedan"]'::jsonb, mht_zone_id, lga_zone_id, 65.00)
    ON CONFLICT DO NOTHING;
  END IF;

  IF ewr_zone_id IS NOT NULL AND mht_zone_id IS NOT NULL THEN
    INSERT INTO pricing_rules (
      rule_name, rule_type, priority, is_active, vehicle_types,
      from_zone_id, to_zone_id, base_price
    ) VALUES
      ('EWR to Manhattan - Sedan', 'zone_to_zone', 5, true, '["sedan"]'::jsonb, ewr_zone_id, mht_zone_id, 85.00),
      ('Manhattan to EWR - Sedan', 'zone_to_zone', 5, true, '["sedan"]'::jsonb, mht_zone_id, ewr_zone_id, 85.00)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- =====================================================
-- SAMPLE VEHICLES
-- =====================================================

INSERT INTO vehicles (
  vehicle_type, make, model, year, color, license_plate, vin,
  capacity, luggage_capacity, status, hourly_rate, amenities
) VALUES
  ('sedan', 'Toyota', 'Camry', 2023, 'Black', 'NYC-1001', 'VIN001SEDAN', 4, 3, 'available', 45.00, '["air_conditioning", "bluetooth", "usb_charging"]'::jsonb),
  ('sedan', 'Honda', 'Accord', 2023, 'Silver', 'NYC-1002', 'VIN002SEDAN', 4, 3, 'available', 45.00, '["air_conditioning", "bluetooth", "usb_charging"]'::jsonb),
  ('suv', 'Chevrolet', 'Suburban', 2023, 'Black', 'NYC-2001', 'VIN001SUV', 6, 5, 'available', 65.00, '["air_conditioning", "bluetooth", "usb_charging", "wifi", "leather_seats"]'::jsonb),
  ('van', 'Mercedes', 'Sprinter', 2023, 'White', 'NYC-3001', 'VIN001VAN', 12, 8, 'available', 85.00, '["air_conditioning", "bluetooth", "usb_charging", "wifi", "tv_screens"]'::jsonb),
  ('luxury', 'BMW', '7 Series', 2024, 'Black', 'NYC-4001', 'VIN001LUX', 4, 3, 'available', 95.00, '["air_conditioning", "bluetooth", "usb_charging", "wifi", "leather_seats", "premium_sound", "water"]'::jsonb)
ON CONFLICT (license_plate) DO NOTHING;

-- =====================================================
-- SAMPLE DRIVERS
-- =====================================================

DO $$
DECLARE
  sedan1_id uuid;
  suv1_id uuid;
  van1_id uuid;
BEGIN
  SELECT id INTO sedan1_id FROM vehicles WHERE license_plate = 'NYC-1001';
  SELECT id INTO suv1_id FROM vehicles WHERE license_plate = 'NYC-2001';
  SELECT id INTO van1_id FROM vehicles WHERE license_plate = 'NYC-3001';

  INSERT INTO drivers (
    first_name, last_name, email, phone, license_number, license_expiry,
    date_of_birth, status, rating, total_trips, vehicle_id, languages, 
    background_check_status
  ) VALUES
    ('Michael', 'Rodriguez', 'michael.rodriguez@example.com', '+1-555-0101', 'DL-NY-001', '2027-12-31', '1985-03-15', 'active', 4.8, 523, sedan1_id, '["en", "es"]'::jsonb, 'approved'),
    ('Sarah', 'Johnson', 'sarah.johnson@example.com', '+1-555-0102', 'DL-NY-002', '2026-08-20', '1990-07-22', 'active', 4.9, 712, suv1_id, '["en"]'::jsonb, 'approved'),
    ('David', 'Chen', 'david.chen@example.com', '+1-555-0103', 'DL-NY-003', '2028-03-15', '1988-11-30', 'active', 4.7, 445, van1_id, '["en", "zh"]'::jsonb, 'approved')
  ON CONFLICT (email) DO NOTHING;
END $$;

-- =====================================================
-- SAMPLE AGENT USER
-- =====================================================

INSERT INTO agent_users (email, name, role, status, permissions) VALUES
  ('dispatch@example.com', 'Demo Dispatch Agent', 'dispatch_manager', 'active', 
   '{"view_bookings": true, "create_bookings": true, "assign_drivers": true, "manage_customers": true, "view_reports": true}'::jsonb)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- SAMPLE CORPORATE ACCOUNT
-- =====================================================

INSERT INTO corporate_accounts (
  company_name, industry, tax_id, billing_address, billing_email,
  credit_limit, payment_terms_days, discount_percentage, status
) VALUES
  ('TechCorp Inc', 'Technology', 'TAX-12345', '123 Business Ave, New York, NY 10001', 'billing@techcorp.com',
   50000.00, 30, 15.0, 'active'),
  ('Global Consulting LLC', 'Consulting', 'TAX-67890', '456 Corporate Plaza, New York, NY 10022', 'accounts@globalconsulting.com',
   25000.00, 30, 10.0, 'active')
ON CONFLICT (company_name) DO NOTHING;

-- =====================================================
-- CORPORATE RATE CARDS
-- =====================================================

DO $$
DECLARE
  corp1_id uuid;
  corp2_id uuid;
  jfk_zone_id uuid;
  mht_zone_id uuid;
BEGIN
  SELECT id INTO corp1_id FROM corporate_accounts WHERE company_name = 'TechCorp Inc';
  SELECT id INTO corp2_id FROM corporate_accounts WHERE company_name = 'Global Consulting LLC';
  SELECT id INTO jfk_zone_id FROM pricing_zones WHERE zone_code = 'JFK';
  SELECT id INTO mht_zone_id FROM pricing_zones WHERE zone_code = 'MHT';

  IF corp1_id IS NOT NULL AND jfk_zone_id IS NOT NULL AND mht_zone_id IS NOT NULL THEN
    INSERT INTO corporate_rate_cards (
      corporate_account_id, route_name, from_zone_id, to_zone_id,
      vehicle_type, flat_rate, is_active
    ) VALUES
      (corp1_id, 'JFK Airport to Manhattan Office', jfk_zone_id, mht_zone_id, 'sedan', 65.00, true),
      (corp1_id, 'Manhattan Office to JFK Airport', mht_zone_id, jfk_zone_id, 'sedan', 65.00, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;