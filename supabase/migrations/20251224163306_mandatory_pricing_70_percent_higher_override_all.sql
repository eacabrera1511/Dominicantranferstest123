/*
  # Mandatory Pricing - 70% Higher - Override Everything

  ## Calculated Prices (70% higher than base)
  
  ### 1. Bayahibe/Zone D (Dreams Dominicus, etc.)
  - Sedan: $136 (was $80)
  - All bigger vehicles: $221 (was $130)
  
  ### 2. SDQ to Punta Cana Resorts
  - Sedan: $204 (was $120)
  - All bigger vehicles: $306 (was $180)
  
  ### 3. Samana Routes
  - All vehicles: $425 (was $250)
  
  ## Priority System
  - Set priority to 999 (highest) to override all other rules
  - These prices are MANDATORY and take precedence
*/

-- STEP 1: Update ALL PUJ to Zone D/Bayahibe pricing with priority 999
UPDATE pricing_rules 
SET 
  base_price = 136,
  priority = 999,
  updated_at = now()
WHERE origin = 'PUJ' 
  AND (
    destination ILIKE '%bayahibe%' 
    OR destination ILIKE '%romana%'
    OR destination ILIKE '%dominicus%'
    OR destination ILIKE '%casa%campo%'
    OR destination ILIKE '%catalonia%royal%'
    OR destination ILIKE '%hilton%la%romana%'
    OR destination ILIKE '%sunscape%'
    OR destination ILIKE '%wyndham%'
    OR zone = 'Zone D'
  )
  AND vehicle_type_id = '0739d0f4-8077-4918-846b-f6d62acc5e18'; -- Sedan

UPDATE pricing_rules 
SET 
  base_price = 221,
  priority = 999,
  updated_at = now()
WHERE origin = 'PUJ' 
  AND (
    destination ILIKE '%bayahibe%' 
    OR destination ILIKE '%romana%'
    OR destination ILIKE '%dominicus%'
    OR destination ILIKE '%casa%campo%'
    OR destination ILIKE '%catalonia%royal%'
    OR destination ILIKE '%hilton%la%romana%'
    OR destination ILIKE '%sunscape%'
    OR destination ILIKE '%wyndham%'
    OR zone = 'Zone D'
  )
  AND vehicle_type_id IN (
    'd3bb2d95-beba-437d-a204-c628b80e0171', -- Minivan
    'cf567eae-5335-44ad-96f2-12d25b37c5c1', -- Suburban
    'a431b998-0fec-4dd8-b576-579ae84f456a', -- Sprinter
    '86fde54a-6260-41e6-b1ab-95b99af44a3d'  -- Mini Bus
  );

-- STEP 2: Update SDQ to Punta Cana/Bavaro/Cap Cana pricing with priority 999
UPDATE pricing_rules 
SET 
  base_price = 204,
  priority = 999,
  updated_at = now()
WHERE origin = 'SDQ' 
  AND (
    destination ILIKE '%punta%cana%' 
    OR destination ILIKE '%bavaro%'
    OR destination ILIKE '%cap%cana%'
  )
  AND vehicle_type_id = '0739d0f4-8077-4918-846b-f6d62acc5e18'; -- Sedan

UPDATE pricing_rules 
SET 
  base_price = 306,
  priority = 999,
  updated_at = now()
WHERE origin = 'SDQ' 
  AND (
    destination ILIKE '%punta%cana%' 
    OR destination ILIKE '%bavaro%'
    OR destination ILIKE '%cap%cana%'
  )
  AND vehicle_type_id IN (
    'd3bb2d95-beba-437d-a204-c628b80e0171', -- Minivan
    'cf567eae-5335-44ad-96f2-12d25b37c5c1', -- Suburban
    'a431b998-0fec-4dd8-b576-579ae84f456a', -- Sprinter
    '86fde54a-6260-41e6-b1ab-95b99af44a3d'  -- Mini Bus
  );

-- STEP 3: Update Samana pricing (both PUJ and SDQ) with priority 999
UPDATE pricing_rules 
SET 
  base_price = 425,
  priority = 999,
  updated_at = now()
WHERE (origin = 'PUJ' OR origin = 'SDQ')
  AND destination ILIKE '%samana%';

-- STEP 4: Disable any conflicting lower-priority rules
UPDATE pricing_rules
SET is_active = false
WHERE (
  (origin = 'PUJ' AND zone = 'Zone D' AND priority < 999)
  OR (origin = 'SDQ' AND (destination ILIKE '%punta%cana%' OR destination ILIKE '%bavaro%') AND priority < 999)
)
AND is_active = true;
