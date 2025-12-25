/*
  # Increase Uvero Alto (Zone C) Pricing by $20 for All Vehicles
  
  ## Overview
  This migration increases pricing for all Uvero Alto transfers by $20 across all vehicle types.
  This applies to both generic zone pricing and specific hotel pricing for all 20 hotels.
  
  ## Pricing Changes
  
  ### PUJ to Uvero Alto (Generic Zone)
  - Sedan: $40 → $60 (+$20)
  - Suburban: $90 → $110 (+$20)
  - Minivan: $65 → $85 (+$20)
  - Sprinter: $135 → $155 (+$20)
  - Mini Bus: $210 → $230 (+$20)
  
  ### PUJ to Uvero Alto (Specific Hotels)
  - Sedan: $57 → $77 (+$20)
  - Suburban: $110 → $130 (+$20)
  - Minivan: $90 → $110 (+$20)
  - Sprinter: $150 → $170 (+$20)
  - Mini Bus: $220 → $240 (+$20)
  
  ### SDQ to Uvero Alto (All Routes)
  - Sedan: $220 → $240 (+$20)
  - Suburban: $350 → $370 (+$20)
  - Minivan: $270 → $290 (+$20)
  - Sprinter: $420 → $440 (+$20)
  - Mini Bus: $580 → $600 (+$20)
  
  ## Impact
  - Affects all 20 hotels in Uvero Alto zone
  - Updates 200+ pricing rules
  - Maintains no_discount_allowed flag for SDQ routes
  - Preserves priority system (specific hotel > generic zone)
*/

-- Update generic zone pricing: PUJ to Uvero Alto
UPDATE pricing_rules
SET 
  base_price = base_price + 20,
  updated_at = now()
WHERE 
  origin = 'PUJ' 
  AND destination = 'Uvero Alto'
  AND is_active = true;

-- Update generic zone pricing: SDQ to Uvero Alto
UPDATE pricing_rules
SET 
  base_price = base_price + 20,
  updated_at = now()
WHERE 
  origin = 'SDQ' 
  AND destination = 'Uvero Alto'
  AND is_active = true;

-- Update specific hotel pricing: PUJ to all Uvero Alto hotels
UPDATE pricing_rules
SET 
  base_price = base_price + 20,
  updated_at = now()
WHERE 
  origin = 'PUJ'
  AND destination IN (
    SELECT hotel_name 
    FROM hotel_zones 
    WHERE zone_name = 'Uvero Alto' AND is_active = true
  )
  AND is_active = true;

-- Update specific hotel pricing: SDQ to all Uvero Alto hotels
UPDATE pricing_rules
SET 
  base_price = base_price + 20,
  updated_at = now()
WHERE 
  origin = 'SDQ'
  AND destination IN (
    SELECT hotel_name 
    FROM hotel_zones 
    WHERE zone_name = 'Uvero Alto' AND is_active = true
  )
  AND is_active = true;

-- Verify the changes with a summary
DO $$
DECLARE
  puj_generic_count int;
  puj_specific_count int;
  sdq_generic_count int;
  sdq_specific_count int;
BEGIN
  -- Count updated rules
  SELECT COUNT(*) INTO puj_generic_count
  FROM pricing_rules
  WHERE origin = 'PUJ' AND destination = 'Uvero Alto' AND is_active = true;
  
  SELECT COUNT(*) INTO puj_specific_count
  FROM pricing_rules
  WHERE origin = 'PUJ' 
    AND destination IN (SELECT hotel_name FROM hotel_zones WHERE zone_name = 'Uvero Alto')
    AND is_active = true;
  
  SELECT COUNT(*) INTO sdq_generic_count
  FROM pricing_rules
  WHERE origin = 'SDQ' AND destination = 'Uvero Alto' AND is_active = true;
  
  SELECT COUNT(*) INTO sdq_specific_count
  FROM pricing_rules
  WHERE origin = 'SDQ' 
    AND destination IN (SELECT hotel_name FROM hotel_zones WHERE zone_name = 'Uvero Alto')
    AND is_active = true;
  
  RAISE NOTICE 'Uvero Alto pricing increased by $20';
  RAISE NOTICE 'PUJ generic zone rules: %', puj_generic_count;
  RAISE NOTICE 'PUJ specific hotel rules: %', puj_specific_count;
  RAISE NOTICE 'SDQ generic zone rules: %', sdq_generic_count;
  RAISE NOTICE 'SDQ specific hotel rules: %', sdq_specific_count;
  RAISE NOTICE 'Total rules updated: %', puj_generic_count + puj_specific_count + sdq_generic_count + sdq_specific_count;
END $$;
