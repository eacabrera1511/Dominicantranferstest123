/*
  # Update Mandatory Pricing for Specific Routes

  ## Changes Made
  
  ### 1. Bayahibe/Zone D Hotels (Dreams Dominicus, etc.)
  - Updated PUJ to Bayahibe pricing:
    - Sedan: $55 → $80 (mandatory minimum)
    - Minivan: $80 → $130
    - Suburban: $110 → $130
    - Sprinter: $160 → $130
    - Mini Bus: $240 → $130
  
  ### 2. SDQ to Punta Cana Resorts
  - Updated pricing:
    - Sedan: $190 → $120
    - Minivan: $230 → $180
    - Suburban: $300 → $180
    - Sprinter: $380 → $180
    - Mini Bus: $520 → $180
  
  ### 3. Samana Routes (New)
  - Added PUJ to Samana: All vehicles $250
  - Added SDQ to Samana: All vehicles $250
  
  ## Notes
  - These are mandatory minimum prices
  - Pricing applies to all hotels in these zones
  - Roundtrip multiplier of 1.9x still applies
*/

-- Update PUJ to Bayahibe (Zone D) pricing
UPDATE pricing_rules 
SET base_price = 80, updated_at = now()
WHERE origin = 'PUJ' 
  AND destination ILIKE '%bayahibe%' 
  AND vehicle_type_id = '0739d0f4-8077-4918-846b-f6d62acc5e18'; -- Sedan

UPDATE pricing_rules 
SET base_price = 130, updated_at = now()
WHERE origin = 'PUJ' 
  AND destination ILIKE '%bayahibe%' 
  AND vehicle_type_id IN (
    'd3bb2d95-beba-437d-a204-c628b80e0171', -- Minivan
    'cf567eae-5335-44ad-96f2-12d25b37c5c1', -- Suburban
    'a431b998-0fec-4dd8-b576-579ae84f456a', -- Sprinter
    '86fde54a-6260-41e6-b1ab-95b99af44a3d'  -- Mini Bus
  );

-- Update PUJ to specific Zone D hotels pricing
UPDATE pricing_rules 
SET base_price = 80, updated_at = now()
WHERE origin = 'PUJ' 
  AND zone = 'Zone D'
  AND vehicle_type_id = '0739d0f4-8077-4918-846b-f6d62acc5e18'; -- Sedan

UPDATE pricing_rules 
SET base_price = 130, updated_at = now()
WHERE origin = 'PUJ' 
  AND zone = 'Zone D'
  AND vehicle_type_id IN (
    'd3bb2d95-beba-437d-a204-c628b80e0171', -- Minivan
    'cf567eae-5335-44ad-96f2-12d25b37c5c1', -- Suburban
    'a431b998-0fec-4dd8-b576-579ae84f456a', -- Sprinter
    '86fde54a-6260-41e6-b1ab-95b99af44a3d'  -- Mini Bus
  );

-- Update SDQ to Punta Cana/Bavaro pricing
UPDATE pricing_rules 
SET base_price = 120, updated_at = now()
WHERE origin = 'SDQ' 
  AND (destination ILIKE '%punta%cana%' OR destination ILIKE '%bavaro%')
  AND vehicle_type_id = '0739d0f4-8077-4918-846b-f6d62acc5e18'; -- Sedan

UPDATE pricing_rules 
SET base_price = 180, updated_at = now()
WHERE origin = 'SDQ' 
  AND (destination ILIKE '%punta%cana%' OR destination ILIKE '%bavaro%')
  AND vehicle_type_id IN (
    'd3bb2d95-beba-437d-a204-c628b80e0171', -- Minivan
    'cf567eae-5335-44ad-96f2-12d25b37c5c1', -- Suburban
    'a431b998-0fec-4dd8-b576-579ae84f456a', -- Sprinter
    '86fde54a-6260-41e6-b1ab-95b99af44a3d'  -- Mini Bus
  );

-- Update SDQ to Cap Cana pricing  
UPDATE pricing_rules 
SET base_price = 120, updated_at = now()
WHERE origin = 'SDQ' 
  AND destination ILIKE '%cap%cana%'
  AND vehicle_type_id = '0739d0f4-8077-4918-846b-f6d62acc5e18'; -- Sedan

UPDATE pricing_rules 
SET base_price = 180, updated_at = now()
WHERE origin = 'SDQ' 
  AND destination ILIKE '%cap%cana%'
  AND vehicle_type_id IN (
    'd3bb2d95-beba-437d-a204-c628b80e0171', -- Minivan
    'cf567eae-5335-44ad-96f2-12d25b37c5c1', -- Suburban
    'a431b998-0fec-4dd8-b576-579ae84f456a', -- Sprinter
    '86fde54a-6260-41e6-b1ab-95b99af44a3d'  -- Mini Bus
  );

-- Add PUJ to Samana pricing (all vehicles $250)
INSERT INTO pricing_rules (
  rule_name,
  rule_type,
  origin,
  destination,
  route_name,
  vehicle_type_id,
  base_price,
  price_per_km,
  price_per_mile,
  time_multiplier,
  priority,
  is_active,
  zone
) VALUES
  ('PUJ-Samana-Sedan', 'zone_to_zone', 'PUJ', 'Samana / Las Terrenas', 'PUJ to Samana', '0739d0f4-8077-4918-846b-f6d62acc5e18', 250, 0, 0, 1.0, 1, true, 'Zone H'),
  ('PUJ-Samana-Minivan', 'zone_to_zone', 'PUJ', 'Samana / Las Terrenas', 'PUJ to Samana', 'd3bb2d95-beba-437d-a204-c628b80e0171', 250, 0, 0, 1.0, 1, true, 'Zone H'),
  ('PUJ-Samana-Suburban', 'zone_to_zone', 'PUJ', 'Samana / Las Terrenas', 'PUJ to Samana', 'cf567eae-5335-44ad-96f2-12d25b37c5c1', 250, 0, 0, 1.0, 1, true, 'Zone H'),
  ('PUJ-Samana-Sprinter', 'zone_to_zone', 'PUJ', 'Samana / Las Terrenas', 'PUJ to Samana', 'a431b998-0fec-4dd8-b576-579ae84f456a', 250, 0, 0, 1.0, 1, true, 'Zone H'),
  ('PUJ-Samana-MiniBus', 'zone_to_zone', 'PUJ', 'Samana / Las Terrenas', 'PUJ to Samana', '86fde54a-6260-41e6-b1ab-95b99af44a3d', 250, 0, 0, 1.0, 1, true, 'Zone H')
ON CONFLICT DO NOTHING;

-- Add SDQ to Samana pricing (all vehicles $250)
INSERT INTO pricing_rules (
  rule_name,
  rule_type,
  origin,
  destination,
  route_name,
  vehicle_type_id,
  base_price,
  price_per_km,
  price_per_mile,
  time_multiplier,
  priority,
  is_active,
  zone
) VALUES
  ('SDQ-Samana-Sedan', 'zone_to_zone', 'SDQ', 'Samana / Las Terrenas', 'SDQ to Samana', '0739d0f4-8077-4918-846b-f6d62acc5e18', 250, 0, 0, 1.0, 1, true, 'Zone H'),
  ('SDQ-Samana-Minivan', 'zone_to_zone', 'SDQ', 'Samana / Las Terrenas', 'SDQ to Samana', 'd3bb2d95-beba-437d-a204-c628b80e0171', 250, 0, 0, 1.0, 1, true, 'Zone H'),
  ('SDQ-Samana-Suburban', 'zone_to_zone', 'SDQ', 'Samana / Las Terrenas', 'SDQ to Samana', 'cf567eae-5335-44ad-96f2-12d25b37c5c1', 250, 0, 0, 1.0, 1, true, 'Zone H'),
  ('SDQ-Samana-Sprinter', 'zone_to_zone', 'SDQ', 'Samana / Las Terrenas', 'SDQ to Samana', 'a431b998-0fec-4dd8-b576-579ae84f456a', 250, 0, 0, 1.0, 1, true, 'Zone H'),
  ('SDQ-Samana-MiniBus', 'zone_to_zone', 'SDQ', 'Samana / Las Terrenas', 'SDQ to Samana', '86fde54a-6260-41e6-b1ab-95b99af44a3d', 250, 0, 0, 1.0, 1, true, 'Zone H')
ON CONFLICT DO NOTHING;
