/*
  # Add Missing Uvero Alto Hotels and Comprehensive Pricing
  
  ## Overview
  This migration adds 11 missing hotels to the Uvero Alto (Zone C) area and ensures 
  comprehensive pricing coverage for all hotels from both PUJ and SDQ airports.
  
  ## New Hotels Added (11 total)
  
  1. **Excellence El Carmen** - Excellence Collection brand (multi-property)
  2. **Royalton CHIC Punta Cana** - Royalton brand (adults-only, different from Royalton Splash)
  3. **Secrets Tides Punta Cana** - Secrets Resorts & Spas brand (multi-property)
  4. **Wyndham Alltra Punta Cana** - Wyndham brand
  5. **Ocean El Faro Resort** - Independent property
  6. **Grand Sirenis Punta Cana** - Sirenis brand
  7. **Dreams Onyx Resort & Spa** - Dreams Resorts & Spa brand (multi-property, different from Dreams Macao)
  8. **Playa Palmera Beach Resort** - Independent property
  9. **Hotel Neon** - Independent property
  10. **Selectum Hacienda Punta Cana** - Selectum brand
  11. **W Punta Cana** - Marriott W Hotels brand (luxury)
  
  ## Pricing Strategy
  
  ### Generic Zone Pricing (Already exists - Priority 1)
  - PUJ to Uvero Alto: $40-$210 depending on vehicle
  - SDQ to Uvero Alto: $220-$580 depending on vehicle
  
  ### Hotel-Specific Pricing (New - Priority 2)
  For enhanced service and exact routing, specific hotels get dedicated pricing:
  - Slightly higher than generic zone pricing
  - Applied when exact hotel name is mentioned
  - Covers all 19 hotels in Uvero Alto
  
  ## Multi-Property Brand Handling
  
  Hotels with `requires_resolution: true` need disambiguation when brand name is generic:
  - **Excellence Collection**: Excellence Punta Cana, Excellence El Carmen
  - **Dreams Resorts & Spa**: Dreams Macao Beach, Dreams Onyx Resort
  - **Royalton**: Royalton Splash, Royalton CHIC
  - **Secrets Resorts & Spas**: Secrets Tides (only one in this zone)
  
  ## Search Terms
  Each hotel includes comprehensive search terms for natural language matching:
  - Full hotel name variations
  - Shortened names
  - Common misspellings
  - Brand names where applicable
*/

-- Step 1: Insert missing Uvero Alto hotels
DO $$
BEGIN
  -- Excellence El Carmen
  IF NOT EXISTS (SELECT 1 FROM hotel_zones WHERE hotel_name = 'Excellence El Carmen') THEN
    INSERT INTO hotel_zones (hotel_name, zone_code, zone_name, search_terms, brand_name, requires_resolution, is_active)
    VALUES (
      'Excellence El Carmen',
      'Zone C',
      'Uvero Alto',
      ARRAY['excellence el carmen', 'el carmen', 'excellence carmen'],
      'Excellence Collection',
      true,
      true
    );
  END IF;

  -- Royalton CHIC Punta Cana
  IF NOT EXISTS (SELECT 1 FROM hotel_zones WHERE hotel_name = 'Royalton CHIC Punta Cana') THEN
    INSERT INTO hotel_zones (hotel_name, zone_code, zone_name, search_terms, brand_name, requires_resolution, is_active)
    VALUES (
      'Royalton CHIC Punta Cana',
      'Zone C',
      'Uvero Alto',
      ARRAY['royalton chic', 'chic punta cana', 'chic'],
      'Royalton',
      true,
      true
    );
  END IF;

  -- Secrets Tides Punta Cana
  IF NOT EXISTS (SELECT 1 FROM hotel_zones WHERE hotel_name = 'Secrets Tides Punta Cana') THEN
    INSERT INTO hotel_zones (hotel_name, zone_code, zone_name, search_terms, brand_name, requires_resolution, is_active)
    VALUES (
      'Secrets Tides Punta Cana',
      'Zone C',
      'Uvero Alto',
      ARRAY['secrets tides', 'tides punta cana', 'secrets tides punta cana'],
      'Secrets Resorts & Spas',
      false,
      true
    );
  END IF;

  -- Wyndham Alltra Punta Cana
  IF NOT EXISTS (SELECT 1 FROM hotel_zones WHERE hotel_name = 'Wyndham Alltra Punta Cana') THEN
    INSERT INTO hotel_zones (hotel_name, zone_code, zone_name, search_terms, brand_name, requires_resolution, is_active)
    VALUES (
      'Wyndham Alltra Punta Cana',
      'Zone C',
      'Uvero Alto',
      ARRAY['wyndham alltra', 'alltra punta cana', 'alltra', 'wyndham'],
      'Wyndham Hotels & Resorts',
      false,
      true
    );
  END IF;

  -- Ocean El Faro Resort
  IF NOT EXISTS (SELECT 1 FROM hotel_zones WHERE hotel_name = 'Ocean El Faro Resort') THEN
    INSERT INTO hotel_zones (hotel_name, zone_code, zone_name, search_terms, brand_name, requires_resolution, is_active)
    VALUES (
      'Ocean El Faro Resort',
      'Zone C',
      'Uvero Alto',
      ARRAY['ocean el faro', 'el faro', 'faro resort'],
      NULL,
      false,
      true
    );
  END IF;

  -- Grand Sirenis Punta Cana
  IF NOT EXISTS (SELECT 1 FROM hotel_zones WHERE hotel_name = 'Grand Sirenis Punta Cana') THEN
    INSERT INTO hotel_zones (hotel_name, zone_code, zone_name, search_terms, brand_name, requires_resolution, is_active)
    VALUES (
      'Grand Sirenis Punta Cana',
      'Zone C',
      'Uvero Alto',
      ARRAY['grand sirenis', 'sirenis punta cana', 'sirenis'],
      'Sirenis Hotels & Resorts',
      false,
      true
    );
  END IF;

  -- Dreams Onyx Resort & Spa
  IF NOT EXISTS (SELECT 1 FROM hotel_zones WHERE hotel_name = 'Dreams Onyx Resort & Spa') THEN
    INSERT INTO hotel_zones (hotel_name, zone_code, zone_name, search_terms, brand_name, requires_resolution, is_active)
    VALUES (
      'Dreams Onyx Resort & Spa',
      'Zone C',
      'Uvero Alto',
      ARRAY['dreams onyx', 'onyx resort', 'dreams onyx punta cana'],
      'Dreams Resorts & Spa',
      true,
      true
    );
  END IF;

  -- Playa Palmera Beach Resort
  IF NOT EXISTS (SELECT 1 FROM hotel_zones WHERE hotel_name = 'Playa Palmera Beach Resort') THEN
    INSERT INTO hotel_zones (hotel_name, zone_code, zone_name, search_terms, brand_name, requires_resolution, is_active)
    VALUES (
      'Playa Palmera Beach Resort',
      'Zone C',
      'Uvero Alto',
      ARRAY['playa palmera', 'palmera beach', 'palmera'],
      NULL,
      false,
      true
    );
  END IF;

  -- Hotel Neon
  IF NOT EXISTS (SELECT 1 FROM hotel_zones WHERE hotel_name = 'Hotel Neon') THEN
    INSERT INTO hotel_zones (hotel_name, zone_code, zone_name, search_terms, brand_name, requires_resolution, is_active)
    VALUES (
      'Hotel Neon',
      'Zone C',
      'Uvero Alto',
      ARRAY['hotel neon', 'neon', 'neon hotel'],
      NULL,
      false,
      true
    );
  END IF;

  -- Selectum Hacienda Punta Cana
  IF NOT EXISTS (SELECT 1 FROM hotel_zones WHERE hotel_name = 'Selectum Hacienda Punta Cana') THEN
    INSERT INTO hotel_zones (hotel_name, zone_code, zone_name, search_terms, brand_name, requires_resolution, is_active)
    VALUES (
      'Selectum Hacienda Punta Cana',
      'Zone C',
      'Uvero Alto',
      ARRAY['selectum hacienda', 'hacienda punta cana', 'selectum'],
      'Selectum Hotels',
      false,
      true
    );
  END IF;

  -- W Punta Cana
  IF NOT EXISTS (SELECT 1 FROM hotel_zones WHERE hotel_name = 'W Punta Cana') THEN
    INSERT INTO hotel_zones (hotel_name, zone_code, zone_name, search_terms, brand_name, requires_resolution, is_active)
    VALUES (
      'W Punta Cana',
      'Zone C',
      'Uvero Alto',
      ARRAY['w punta cana', 'w hotel', 'w resort'],
      'W Hotels',
      false,
      true
    );
  END IF;
END $$;

-- Step 2: Create hotel-specific pricing rules for ALL Uvero Alto hotels
DO $$
DECLARE
  sedan_id uuid;
  suburban_id uuid;
  minivan_id uuid;
  sprinter_id uuid;
  minibus_id uuid;
  uvero_hotel record;
  rule_exists boolean;
BEGIN
  -- Get vehicle type IDs
  SELECT id INTO sedan_id FROM vehicle_types WHERE name = 'Sedan' LIMIT 1;
  SELECT id INTO suburban_id FROM vehicle_types WHERE name = 'Suburban' LIMIT 1;
  SELECT id INTO minivan_id FROM vehicle_types WHERE name = 'Minivan' LIMIT 1;
  SELECT id INTO sprinter_id FROM vehicle_types WHERE name = 'Sprinter' LIMIT 1;
  SELECT id INTO minibus_id FROM vehicle_types WHERE name = 'Mini Bus' LIMIT 1;

  -- Loop through all Uvero Alto hotels and create specific pricing
  FOR uvero_hotel IN 
    SELECT hotel_name FROM hotel_zones WHERE zone_name = 'Uvero Alto' AND is_active = true
  LOOP
    -- PUJ to specific hotel pricing
    -- Check and insert Sedan
    SELECT EXISTS(SELECT 1 FROM pricing_rules WHERE rule_name = 'PUJ-' || REPLACE(uvero_hotel.hotel_name, ' ', '') || '-Sedan') INTO rule_exists;
    IF NOT rule_exists THEN
      INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, vehicle_type_id, base_price, price_per_km, is_active, priority)
      VALUES ('PUJ-' || REPLACE(uvero_hotel.hotel_name, ' ', '') || '-Sedan', 'zone_to_zone', 'PUJ', uvero_hotel.hotel_name, sedan_id, 57, 0, true, 2);
    END IF;

    -- Check and insert Suburban
    SELECT EXISTS(SELECT 1 FROM pricing_rules WHERE rule_name = 'PUJ-' || REPLACE(uvero_hotel.hotel_name, ' ', '') || '-Suburban') INTO rule_exists;
    IF NOT rule_exists THEN
      INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, vehicle_type_id, base_price, price_per_km, is_active, priority)
      VALUES ('PUJ-' || REPLACE(uvero_hotel.hotel_name, ' ', '') || '-Suburban', 'zone_to_zone', 'PUJ', uvero_hotel.hotel_name, suburban_id, 110, 0, true, 2);
    END IF;

    -- Check and insert Minivan
    SELECT EXISTS(SELECT 1 FROM pricing_rules WHERE rule_name = 'PUJ-' || REPLACE(uvero_hotel.hotel_name, ' ', '') || '-Minivan') INTO rule_exists;
    IF NOT rule_exists THEN
      INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, vehicle_type_id, base_price, price_per_km, is_active, priority)
      VALUES ('PUJ-' || REPLACE(uvero_hotel.hotel_name, ' ', '') || '-Minivan', 'zone_to_zone', 'PUJ', uvero_hotel.hotel_name, minivan_id, 90, 0, true, 2);
    END IF;

    -- Check and insert Sprinter
    SELECT EXISTS(SELECT 1 FROM pricing_rules WHERE rule_name = 'PUJ-' || REPLACE(uvero_hotel.hotel_name, ' ', '') || '-Sprinter') INTO rule_exists;
    IF NOT rule_exists THEN
      INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, vehicle_type_id, base_price, price_per_km, is_active, priority)
      VALUES ('PUJ-' || REPLACE(uvero_hotel.hotel_name, ' ', '') || '-Sprinter', 'zone_to_zone', 'PUJ', uvero_hotel.hotel_name, sprinter_id, 150, 0, true, 2);
    END IF;

    -- Check and insert MiniBus
    SELECT EXISTS(SELECT 1 FROM pricing_rules WHERE rule_name = 'PUJ-' || REPLACE(uvero_hotel.hotel_name, ' ', '') || '-MiniBus') INTO rule_exists;
    IF NOT rule_exists THEN
      INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, vehicle_type_id, base_price, price_per_km, is_active, priority)
      VALUES ('PUJ-' || REPLACE(uvero_hotel.hotel_name, ' ', '') || '-MiniBus', 'zone_to_zone', 'PUJ', uvero_hotel.hotel_name, minibus_id, 220, 0, true, 2);
    END IF;

    -- SDQ to specific hotel pricing (no discounts allowed)
    -- Check and insert Sedan
    SELECT EXISTS(SELECT 1 FROM pricing_rules WHERE rule_name = 'SDQ-' || REPLACE(uvero_hotel.hotel_name, ' ', '') || '-Sedan') INTO rule_exists;
    IF NOT rule_exists THEN
      INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, vehicle_type_id, base_price, price_per_km, is_active, priority, no_discount_allowed)
      VALUES ('SDQ-' || REPLACE(uvero_hotel.hotel_name, ' ', '') || '-Sedan', 'zone_to_zone', 'SDQ', uvero_hotel.hotel_name, sedan_id, 220, 0, true, 2, true);
    END IF;

    -- Check and insert Suburban
    SELECT EXISTS(SELECT 1 FROM pricing_rules WHERE rule_name = 'SDQ-' || REPLACE(uvero_hotel.hotel_name, ' ', '') || '-Suburban') INTO rule_exists;
    IF NOT rule_exists THEN
      INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, vehicle_type_id, base_price, price_per_km, is_active, priority, no_discount_allowed)
      VALUES ('SDQ-' || REPLACE(uvero_hotel.hotel_name, ' ', '') || '-Suburban', 'zone_to_zone', 'SDQ', uvero_hotel.hotel_name, suburban_id, 350, 0, true, 2, true);
    END IF;

    -- Check and insert Minivan
    SELECT EXISTS(SELECT 1 FROM pricing_rules WHERE rule_name = 'SDQ-' || REPLACE(uvero_hotel.hotel_name, ' ', '') || '-Minivan') INTO rule_exists;
    IF NOT rule_exists THEN
      INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, vehicle_type_id, base_price, price_per_km, is_active, priority, no_discount_allowed)
      VALUES ('SDQ-' || REPLACE(uvero_hotel.hotel_name, ' ', '') || '-Minivan', 'zone_to_zone', 'SDQ', uvero_hotel.hotel_name, minivan_id, 270, 0, true, 2, true);
    END IF;

    -- Check and insert Sprinter
    SELECT EXISTS(SELECT 1 FROM pricing_rules WHERE rule_name = 'SDQ-' || REPLACE(uvero_hotel.hotel_name, ' ', '') || '-Sprinter') INTO rule_exists;
    IF NOT rule_exists THEN
      INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, vehicle_type_id, base_price, price_per_km, is_active, priority, no_discount_allowed)
      VALUES ('SDQ-' || REPLACE(uvero_hotel.hotel_name, ' ', '') || '-Sprinter', 'zone_to_zone', 'SDQ', uvero_hotel.hotel_name, sprinter_id, 420, 0, true, 2, true);
    END IF;

    -- Check and insert MiniBus
    SELECT EXISTS(SELECT 1 FROM pricing_rules WHERE rule_name = 'SDQ-' || REPLACE(uvero_hotel.hotel_name, ' ', '') || '-MiniBus') INTO rule_exists;
    IF NOT rule_exists THEN
      INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, vehicle_type_id, base_price, price_per_km, is_active, priority, no_discount_allowed)
      VALUES ('SDQ-' || REPLACE(uvero_hotel.hotel_name, ' ', '') || '-MiniBus', 'zone_to_zone', 'SDQ', uvero_hotel.hotel_name, minibus_id, 580, 0, true, 2, true);
    END IF;

  END LOOP;
END $$;
