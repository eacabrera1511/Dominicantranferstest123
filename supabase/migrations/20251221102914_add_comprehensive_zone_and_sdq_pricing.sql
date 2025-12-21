/*
  # Add Comprehensive Zone-Based Pricing for All Zones
  
  1. Purpose
    - Add zone-based fallback pricing (priority 1) for ALL zones
    - Ensures every hotel has pricing even without hotel-specific rules
    - Fixes missing pricing for Santo Domingo hotels
    
  2. Changes
    - Add Zone A (Bavaro) → PUJ zone-based pricing
    - Add Zone B (Cap Cana) → PUJ zone-based pricing  
    - Add Zone C (Uvero Alto) → PUJ zone-based pricing
    - Add Zone D (Bayahibe) → PUJ zone-based pricing
    - Add Zone E (Santo Domingo) → SDQ zone-based pricing
    - Add Zone E (Santo Domingo) → PUJ zone-based pricing (longer distance)
    
  3. Security
    - Maintains existing RLS policies
*/

-- =====================================================
-- ZONE-BASED PRICING FROM PUJ TO ALL ZONES (Priority 1 - Fallback)
-- =====================================================

-- PUJ → Zone A (Bavaro / Punta Cana) - FALLBACK
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, zone, vehicle_type_id, base_price, priority, is_active)
SELECT 
  'PUJ-ZoneA-' || vt.name,
  'zone_to_zone',
  'PUJ',
  'Bavaro / Punta Cana',
  'Zone A',
  vt.id,
  CASE vt.name
    WHEN 'Sedan' THEN 25
    WHEN 'Minivan' THEN 45
    WHEN 'Suburban' THEN 65
    WHEN 'Sprinter' THEN 95
    WHEN 'Mini Bus' THEN 150
  END,
  1,
  true
FROM vehicle_types vt
WHERE vt.name IN ('Sedan', 'Minivan', 'Suburban', 'Sprinter', 'Mini Bus')
ON CONFLICT DO NOTHING;

-- PUJ → Zone B (Cap Cana) - FALLBACK
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, zone, vehicle_type_id, base_price, priority, is_active)
SELECT 
  'PUJ-ZoneB-' || vt.name,
  'zone_to_zone',
  'PUJ',
  'Cap Cana',
  'Zone B',
  vt.id,
  CASE vt.name
    WHEN 'Sedan' THEN 30
    WHEN 'Minivan' THEN 50
    WHEN 'Suburban' THEN 75
    WHEN 'Sprinter' THEN 105
    WHEN 'Mini Bus' THEN 165
  END,
  1,
  true
FROM vehicle_types vt
WHERE vt.name IN ('Sedan', 'Minivan', 'Suburban', 'Sprinter', 'Mini Bus')
ON CONFLICT DO NOTHING;

-- PUJ → Zone C (Uvero Alto) - FALLBACK
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, zone, vehicle_type_id, base_price, priority, is_active)
SELECT 
  'PUJ-ZoneC-' || vt.name,
  'zone_to_zone',
  'PUJ',
  'Uvero Alto',
  'Zone C',
  vt.id,
  CASE vt.name
    WHEN 'Sedan' THEN 40
    WHEN 'Minivan' THEN 65
    WHEN 'Suburban' THEN 90
    WHEN 'Sprinter' THEN 120
    WHEN 'Mini Bus' THEN 185
  END,
  1,
  true
FROM vehicle_types vt
WHERE vt.name IN ('Sedan', 'Minivan', 'Suburban', 'Sprinter', 'Mini Bus')
ON CONFLICT DO NOTHING;

-- PUJ → Zone D (Bayahibe) - FALLBACK
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, zone, vehicle_type_id, base_price, priority, is_active)
SELECT 
  'PUJ-ZoneD-' || vt.name,
  'zone_to_zone',
  'PUJ',
  'Bayahibe',
  'Zone D',
  vt.id,
  CASE vt.name
    WHEN 'Sedan' THEN 55
    WHEN 'Minivan' THEN 80
    WHEN 'Suburban' THEN 110
    WHEN 'Sprinter' THEN 145
    WHEN 'Mini Bus' THEN 210
  END,
  1,
  true
FROM vehicle_types vt
WHERE vt.name IN ('Sedan', 'Minivan', 'Suburban', 'Sprinter', 'Mini Bus')
ON CONFLICT DO NOTHING;

-- PUJ → Zone E (Santo Domingo) - FALLBACK (longer distance from PUJ)
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, zone, vehicle_type_id, base_price, priority, is_active)
SELECT 
  'PUJ-ZoneE-' || vt.name,
  'zone_to_zone',
  'PUJ',
  'Santo Domingo',
  'Zone E',
  vt.id,
  CASE vt.name
    WHEN 'Sedan' THEN 85
    WHEN 'Minivan' THEN 125
    WHEN 'Suburban' THEN 165
    WHEN 'Sprinter' THEN 215
    WHEN 'Mini Bus' THEN 295
  END,
  1,
  true
FROM vehicle_types vt
WHERE vt.name IN ('Sedan', 'Minivan', 'Suburban', 'Sprinter', 'Mini Bus')
ON CONFLICT DO NOTHING;

-- =====================================================
-- ZONE-BASED PRICING FROM SDQ TO SANTO DOMINGO (Priority 1 - Fallback)
-- =====================================================

-- SDQ → Zone E (Santo Domingo) - FALLBACK
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, zone, vehicle_type_id, base_price, priority, is_active)
SELECT 
  'SDQ-ZoneE-' || vt.name,
  'zone_to_zone',
  'SDQ',
  'Santo Domingo',
  'Zone E',
  vt.id,
  CASE vt.name
    WHEN 'Sedan' THEN 28
    WHEN 'Minivan' THEN 50
    WHEN 'Suburban' THEN 70
    WHEN 'Sprinter' THEN 100
    WHEN 'Mini Bus' THEN 150
  END,
  1,
  true
FROM vehicle_types vt
WHERE vt.name IN ('Sedan', 'Minivan', 'Suburban', 'Sprinter', 'Mini Bus')
ON CONFLICT DO NOTHING;

-- =====================================================
-- REVERSE ROUTES - ALL ZONES TO PUJ
-- =====================================================

-- Zone A → PUJ
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, zone, vehicle_type_id, base_price, priority, is_active)
SELECT 
  'ZoneA-PUJ-' || vt.name,
  'zone_to_zone',
  'Bavaro / Punta Cana',
  'PUJ',
  'Zone A',
  vt.id,
  CASE vt.name
    WHEN 'Sedan' THEN 25
    WHEN 'Minivan' THEN 45
    WHEN 'Suburban' THEN 65
    WHEN 'Sprinter' THEN 95
    WHEN 'Mini Bus' THEN 150
  END,
  1,
  true
FROM vehicle_types vt
WHERE vt.name IN ('Sedan', 'Minivan', 'Suburban', 'Sprinter', 'Mini Bus')
ON CONFLICT DO NOTHING;

-- Zone B → PUJ
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, zone, vehicle_type_id, base_price, priority, is_active)
SELECT 
  'ZoneB-PUJ-' || vt.name,
  'zone_to_zone',
  'Cap Cana',
  'PUJ',
  'Zone B',
  vt.id,
  CASE vt.name
    WHEN 'Sedan' THEN 30
    WHEN 'Minivan' THEN 50
    WHEN 'Suburban' THEN 75
    WHEN 'Sprinter' THEN 105
    WHEN 'Mini Bus' THEN 165
  END,
  1,
  true
FROM vehicle_types vt
WHERE vt.name IN ('Sedan', 'Minivan', 'Suburban', 'Sprinter', 'Mini Bus')
ON CONFLICT DO NOTHING;

-- Zone C → PUJ
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, zone, vehicle_type_id, base_price, priority, is_active)
SELECT 
  'ZoneC-PUJ-' || vt.name,
  'zone_to_zone',
  'Uvero Alto',
  'PUJ',
  'Zone C',
  vt.id,
  CASE vt.name
    WHEN 'Sedan' THEN 40
    WHEN 'Minivan' THEN 65
    WHEN 'Suburban' THEN 90
    WHEN 'Sprinter' THEN 120
    WHEN 'Mini Bus' THEN 185
  END,
  1,
  true
FROM vehicle_types vt
WHERE vt.name IN ('Sedan', 'Minivan', 'Suburban', 'Sprinter', 'Mini Bus')
ON CONFLICT DO NOTHING;

-- Zone D → PUJ
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, zone, vehicle_type_id, base_price, priority, is_active)
SELECT 
  'ZoneD-PUJ-' || vt.name,
  'zone_to_zone',
  'Bayahibe',
  'PUJ',
  'Zone D',
  vt.id,
  CASE vt.name
    WHEN 'Sedan' THEN 55
    WHEN 'Minivan' THEN 80
    WHEN 'Suburban' THEN 110
    WHEN 'Sprinter' THEN 145
    WHEN 'Mini Bus' THEN 210
  END,
  1,
  true
FROM vehicle_types vt
WHERE vt.name IN ('Sedan', 'Minivan', 'Suburban', 'Sprinter', 'Mini Bus')
ON CONFLICT DO NOTHING;

-- Zone E → PUJ
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, zone, vehicle_type_id, base_price, priority, is_active)
SELECT 
  'ZoneE-PUJ-' || vt.name,
  'zone_to_zone',
  'Santo Domingo',
  'PUJ',
  'Zone E',
  vt.id,
  CASE vt.name
    WHEN 'Sedan' THEN 85
    WHEN 'Minivan' THEN 125
    WHEN 'Suburban' THEN 165
    WHEN 'Sprinter' THEN 215
    WHEN 'Mini Bus' THEN 295
  END,
  1,
  true
FROM vehicle_types vt
WHERE vt.name IN ('Sedan', 'Minivan', 'Suburban', 'Sprinter', 'Mini Bus')
ON CONFLICT DO NOTHING;

-- Zone E → SDQ
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, zone, vehicle_type_id, base_price, priority, is_active)
SELECT 
  'ZoneE-SDQ-' || vt.name,
  'zone_to_zone',
  'Santo Domingo',
  'SDQ',
  'Zone E',
  vt.id,
  CASE vt.name
    WHEN 'Sedan' THEN 28
    WHEN 'Minivan' THEN 50
    WHEN 'Suburban' THEN 70
    WHEN 'Sprinter' THEN 100
    WHEN 'Mini Bus' THEN 150
  END,
  1,
  true
FROM vehicle_types vt
WHERE vt.name IN ('Sedan', 'Minivan', 'Suburban', 'Sprinter', 'Mini Bus')
ON CONFLICT DO NOTHING;
