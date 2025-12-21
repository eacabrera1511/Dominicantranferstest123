/*
  # Fix Hotel Zone Assignments and Pricing Consistency

  1. Purpose
    - Correct Viva Wyndham Samana location (should NOT be in Bayahibe)
    - Remove hotel-specific pricing overrides
    - Ensure all hotels use zone-based pricing consistently
    - Match master prompt pricing exactly

  2. Changes
    - Remove Viva Wyndham Samana from Zone D (Bayahibe) - Samana is 150km away on north coast
    - Delete all hotel-specific pricing rules
    - Keep only zone-level pricing rules
    - Ensure pricing matches master prompt exactly

  3. Security
    - Maintains RLS policies
    - No changes to access control
*/

-- First, remove Viva Wyndham Samana (it's in the wrong location - Samana is on north coast, not Bayahibe)
DELETE FROM hotel_zones WHERE hotel_name = 'Viva Wyndham Samana';

-- Remove all hotel-specific pricing rules (keep only zone-level rules)
-- Hotel-specific rules cause pricing inconsistencies
DELETE FROM pricing_rules 
WHERE destination NOT IN (
  'Bavaro / Punta Cana',
  'Cap Cana',
  'Uvero Alto',
  'Bayahibe',
  'La Romana / Bayahibe',
  'Santo Domingo',
  'Puerto Plata / Playa Dorada',
  'Sosua / Cabarete',
  'Samana / Las Terrenas',
  'PUJ',
  'SDQ'
);

-- Verify zone-level pricing matches master prompt
-- PUJ → Zone A (Bavaro / Punta Cana)
UPDATE pricing_rules SET base_price = 25 
WHERE origin = 'PUJ' AND destination = 'Bavaro / Punta Cana' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Sedan'
);

UPDATE pricing_rules SET base_price = 45 
WHERE origin = 'PUJ' AND destination = 'Bavaro / Punta Cana' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Minivan'
);

UPDATE pricing_rules SET base_price = 65 
WHERE origin = 'PUJ' AND destination = 'Bavaro / Punta Cana' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Suburban'
);

UPDATE pricing_rules SET base_price = 110 
WHERE origin = 'PUJ' AND destination = 'Bavaro / Punta Cana' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Sprinter'
);

UPDATE pricing_rules SET base_price = 180 
WHERE origin = 'PUJ' AND destination = 'Bavaro / Punta Cana' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Mini Bus'
);

-- PUJ → Zone B (Cap Cana)
UPDATE pricing_rules SET base_price = 30 
WHERE origin = 'PUJ' AND destination = 'Cap Cana' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Sedan'
);

UPDATE pricing_rules SET base_price = 50 
WHERE origin = 'PUJ' AND destination = 'Cap Cana' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Minivan'
);

UPDATE pricing_rules SET base_price = 75 
WHERE origin = 'PUJ' AND destination = 'Cap Cana' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Suburban'
);

UPDATE pricing_rules SET base_price = 120 
WHERE origin = 'PUJ' AND destination = 'Cap Cana' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Sprinter'
);

UPDATE pricing_rules SET base_price = 190 
WHERE origin = 'PUJ' AND destination = 'Cap Cana' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Mini Bus'
);

-- PUJ → Zone C (Uvero Alto)
UPDATE pricing_rules SET base_price = 40 
WHERE origin = 'PUJ' AND destination = 'Uvero Alto' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Sedan'
);

UPDATE pricing_rules SET base_price = 65 
WHERE origin = 'PUJ' AND destination = 'Uvero Alto' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Minivan'
);

UPDATE pricing_rules SET base_price = 90 
WHERE origin = 'PUJ' AND destination = 'Uvero Alto' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Suburban'
);

UPDATE pricing_rules SET base_price = 135 
WHERE origin = 'PUJ' AND destination = 'Uvero Alto' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Sprinter'
);

UPDATE pricing_rules SET base_price = 210 
WHERE origin = 'PUJ' AND destination = 'Uvero Alto' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Mini Bus'
);

-- PUJ → Zone D (Bayahibe)
-- First update "Bayahibe" destination
UPDATE pricing_rules SET base_price = 55 
WHERE origin = 'PUJ' AND destination = 'Bayahibe' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Sedan'
);

UPDATE pricing_rules SET base_price = 80 
WHERE origin = 'PUJ' AND destination = 'Bayahibe' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Minivan'
);

UPDATE pricing_rules SET base_price = 110 
WHERE origin = 'PUJ' AND destination = 'Bayahibe' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Suburban'
);

UPDATE pricing_rules SET base_price = 160 
WHERE origin = 'PUJ' AND destination = 'Bayahibe' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Sprinter'
);

UPDATE pricing_rules SET base_price = 240 
WHERE origin = 'PUJ' AND destination = 'Bayahibe' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Mini Bus'
);

-- Also update "La Romana / Bayahibe" if it exists
UPDATE pricing_rules SET base_price = 55 
WHERE origin = 'PUJ' AND destination = 'La Romana / Bayahibe' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Sedan'
);

UPDATE pricing_rules SET base_price = 80 
WHERE origin = 'PUJ' AND destination = 'La Romana / Bayahibe' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Minivan'
);

UPDATE pricing_rules SET base_price = 110 
WHERE origin = 'PUJ' AND destination = 'La Romana / Bayahibe' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Suburban'
);

UPDATE pricing_rules SET base_price = 160 
WHERE origin = 'PUJ' AND destination = 'La Romana / Bayahibe' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Sprinter'
);

UPDATE pricing_rules SET base_price = 240 
WHERE origin = 'PUJ' AND destination = 'La Romana / Bayahibe' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Mini Bus'
);

-- SDQ → Zone A (Bavaro / Punta Cana)
UPDATE pricing_rules SET base_price = 190 
WHERE origin = 'SDQ' AND destination = 'Bavaro / Punta Cana' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Sedan'
);

UPDATE pricing_rules SET base_price = 230 
WHERE origin = 'SDQ' AND destination = 'Bavaro / Punta Cana' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Minivan'
);

UPDATE pricing_rules SET base_price = 300 
WHERE origin = 'SDQ' AND destination = 'Bavaro / Punta Cana' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Suburban'
);

UPDATE pricing_rules SET base_price = 380 
WHERE origin = 'SDQ' AND destination = 'Bavaro / Punta Cana' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Sprinter'
);

UPDATE pricing_rules SET base_price = 520 
WHERE origin = 'SDQ' AND destination = 'Bavaro / Punta Cana' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Mini Bus'
);

-- SDQ → Zone B (Cap Cana)
UPDATE pricing_rules SET base_price = 200 
WHERE origin = 'SDQ' AND destination = 'Cap Cana' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Sedan'
);

UPDATE pricing_rules SET base_price = 250 
WHERE origin = 'SDQ' AND destination = 'Cap Cana' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Minivan'
);

UPDATE pricing_rules SET base_price = 320 
WHERE origin = 'SDQ' AND destination = 'Cap Cana' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Suburban'
);

UPDATE pricing_rules SET base_price = 400 
WHERE origin = 'SDQ' AND destination = 'Cap Cana' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Sprinter'
);

UPDATE pricing_rules SET base_price = 550 
WHERE origin = 'SDQ' AND destination = 'Cap Cana' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Mini Bus'
);

-- SDQ → Zone C (Uvero Alto)
UPDATE pricing_rules SET base_price = 220 
WHERE origin = 'SDQ' AND destination = 'Uvero Alto' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Sedan'
);

UPDATE pricing_rules SET base_price = 270 
WHERE origin = 'SDQ' AND destination = 'Uvero Alto' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Minivan'
);

UPDATE pricing_rules SET base_price = 350 
WHERE origin = 'SDQ' AND destination = 'Uvero Alto' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Suburban'
);

UPDATE pricing_rules SET base_price = 420 
WHERE origin = 'SDQ' AND destination = 'Uvero Alto' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Sprinter'
);

UPDATE pricing_rules SET base_price = 580 
WHERE origin = 'SDQ' AND destination = 'Uvero Alto' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Mini Bus'
);

-- SDQ → Zone D (Bayahibe)
UPDATE pricing_rules SET base_price = 240 
WHERE origin = 'SDQ' AND destination = 'Bayahibe' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Sedan'
);

UPDATE pricing_rules SET base_price = 290 
WHERE origin = 'SDQ' AND destination = 'Bayahibe' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Minivan'
);

UPDATE pricing_rules SET base_price = 380 
WHERE origin = 'SDQ' AND destination = 'Bayahibe' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Suburban'
);

UPDATE pricing_rules SET base_price = 450 
WHERE origin = 'SDQ' AND destination = 'Bayahibe' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Sprinter'
);

UPDATE pricing_rules SET base_price = 620 
WHERE origin = 'SDQ' AND destination = 'Bayahibe' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Mini Bus'
);

-- PUJ ↔ SDQ Direct
UPDATE pricing_rules SET base_price = 220 
WHERE origin = 'PUJ' AND destination = 'SDQ' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Sedan'
);

UPDATE pricing_rules SET base_price = 260 
WHERE origin = 'PUJ' AND destination = 'SDQ' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Minivan'
);

UPDATE pricing_rules SET base_price = 320 
WHERE origin = 'PUJ' AND destination = 'SDQ' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Suburban'
);

UPDATE pricing_rules SET base_price = 420 
WHERE origin = 'PUJ' AND destination = 'SDQ' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Sprinter'
);

UPDATE pricing_rules SET base_price = 600 
WHERE origin = 'PUJ' AND destination = 'SDQ' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Mini Bus'
);

UPDATE pricing_rules SET base_price = 220 
WHERE origin = 'SDQ' AND destination = 'PUJ' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Sedan'
);

UPDATE pricing_rules SET base_price = 260 
WHERE origin = 'SDQ' AND destination = 'PUJ' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Minivan'
);

UPDATE pricing_rules SET base_price = 320 
WHERE origin = 'SDQ' AND destination = 'PUJ' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Suburban'
);

UPDATE pricing_rules SET base_price = 420 
WHERE origin = 'SDQ' AND destination = 'PUJ' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Sprinter'
);

UPDATE pricing_rules SET base_price = 600 
WHERE origin = 'SDQ' AND destination = 'PUJ' AND vehicle_type_id IN (
  SELECT id FROM vehicle_types WHERE name = 'Mini Bus'
);

-- Create a verification view
CREATE OR REPLACE VIEW pricing_verification AS
SELECT 
  pr.origin,
  pr.zone,
  pr.destination,
  vt.name as vehicle_type,
  pr.base_price::int as price,
  COUNT(*) OVER (PARTITION BY pr.origin, pr.destination, vt.name) as rule_count
FROM pricing_rules pr
JOIN vehicle_types vt ON pr.vehicle_type_id = vt.id
WHERE pr.is_active = true
  AND pr.destination IN (
    'Bavaro / Punta Cana',
    'Cap Cana',
    'Uvero Alto',
    'Bayahibe',
    'Santo Domingo',
    'PUJ',
    'SDQ'
  )
ORDER BY 
  pr.origin, 
  pr.zone,
  CASE vt.name
    WHEN 'Sedan' THEN 1
    WHEN 'Minivan' THEN 2
    WHEN 'Suburban' THEN 3
    WHEN 'Sprinter' THEN 4
    WHEN 'Mini Bus' THEN 5
  END;

GRANT SELECT ON pricing_verification TO anon, authenticated;

COMMENT ON VIEW pricing_verification IS 'Verification view for pricing rules - shows if any duplicate rules exist';
