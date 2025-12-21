/*
  # Fix Generic Brand Keywords in Search Terms
  
  1. Purpose
    - Remove generic brand keywords from search_terms that cause ambiguous matches
    - Keep only specific property identifiers in search_terms
    - Fixes issue where "dreams" matches all Dreams properties
    
  2. Changes
    - Remove generic "dreams" from Dreams properties (keep specific ones like "dreams royal")
    - Remove generic "riu" from RIU properties
    - Remove generic "secrets" from Secrets properties
    - Remove generic brand keywords from all multi-property brands
    
  3. Security
    - Maintains existing RLS policies
*/

-- Fix Dreams properties - remove generic "dreams" search term
UPDATE hotel_zones
SET search_terms = array_remove(search_terms, 'dreams')
WHERE brand_name = 'Dreams Resorts & Spa'
  AND 'dreams' = ANY(search_terms)
  AND array_length(search_terms, 1) > 1;

-- Fix Secrets properties - remove generic "secrets" search term
UPDATE hotel_zones
SET search_terms = array_remove(search_terms, 'secrets')
WHERE brand_name = 'Secrets Resorts & Spas'
  AND 'secrets' = ANY(search_terms)
  AND array_length(search_terms, 1) > 1;

-- Fix RIU properties - remove generic "riu" search term
UPDATE hotel_zones
SET search_terms = array_remove(search_terms, 'riu')
WHERE brand_name = 'RIU Hotels & Resorts'
  AND 'riu' = ANY(search_terms)
  AND array_length(search_terms, 1) > 1;

-- Fix Bahia Principe properties - remove generic "bahia" search term
UPDATE hotel_zones
SET search_terms = array_remove(search_terms, 'bahia')
WHERE brand_name = 'Bahia Principe'
  AND 'bahia' = ANY(search_terms)
  AND array_length(search_terms, 1) > 1;

-- Fix Barceló properties - remove generic "barcelo" search term
UPDATE hotel_zones
SET search_terms = array_remove(search_terms, 'barcelo')
WHERE brand_name = 'Barceló Hotels & Resorts'
  AND 'barcelo' = ANY(search_terms)
  AND array_length(search_terms, 1) > 1;

-- Fix Iberostar properties - remove generic "iberostar" search term
UPDATE hotel_zones
SET search_terms = array_remove(search_terms, 'iberostar')
WHERE brand_name = 'Iberostar Hotels & Resorts'
  AND 'iberostar' = ANY(search_terms)
  AND array_length(search_terms, 1) > 1;

-- Fix Royalton properties - remove generic "royalton" search term
UPDATE hotel_zones
SET search_terms = array_remove(search_terms, 'royalton')
WHERE brand_name = 'Royalton'
  AND 'royalton' = ANY(search_terms)
  AND array_length(search_terms, 1) > 1;

-- Fix Majestic properties - remove generic "majestic" search term
UPDATE hotel_zones
SET search_terms = array_remove(search_terms, 'majestic')
WHERE brand_name = 'Majestic Resorts'
  AND 'majestic' = ANY(search_terms)
  AND array_length(search_terms, 1) > 1;

-- Fix Catalonia properties - remove generic "catalonia" search term
UPDATE hotel_zones
SET search_terms = array_remove(search_terms, 'catalonia')
WHERE brand_name = 'Catalonia Hotels & Resorts'
  AND 'catalonia' = ANY(search_terms)
  AND array_length(search_terms, 1) > 1;

-- Fix Excellence properties - remove generic "excellence" search term
UPDATE hotel_zones
SET search_terms = array_remove(search_terms, 'excellence')
WHERE brand_name = 'Excellence Collection'
  AND 'excellence' = ANY(search_terms)
  AND array_length(search_terms, 1) > 1;

-- Fix Occidental properties - remove generic "occidental" search term
UPDATE hotel_zones
SET search_terms = array_remove(search_terms, 'occidental')
WHERE brand_name = 'Occidental Hotels & Resorts'
  AND 'occidental' = ANY(search_terms)
  AND array_length(search_terms, 1) > 1;

-- Fix Viva Wyndham properties - remove generic "viva" search term
UPDATE hotel_zones
SET search_terms = array_remove(search_terms, 'viva')
WHERE brand_name = 'Viva Wyndham'
  AND 'viva' = ANY(search_terms)
  AND array_length(search_terms, 1) > 1;

-- Fix Lopesan properties - remove generic "lopesan" search term
UPDATE hotel_zones
SET search_terms = array_remove(search_terms, 'lopesan')
WHERE brand_name = 'Lopesan'
  AND 'lopesan' = ANY(search_terms)
  AND array_length(search_terms, 1) > 1;

-- Fix Meliá properties - remove generic "melia" search term
UPDATE hotel_zones
SET search_terms = array_remove(array_remove(search_terms, 'melia'), 'meliá')
WHERE brand_name = 'Meliá Hotels International'
  AND ('melia' = ANY(search_terms) OR 'meliá' = ANY(search_terms))
  AND array_length(search_terms, 1) > 1;

-- Fix Palladium/TRS properties - remove generic "trs" from TRS properties
UPDATE hotel_zones
SET search_terms = array_remove(search_terms, 'trs')
WHERE brand_name = 'Palladium Hotel Group'
  AND hotel_name LIKE 'TRS%'
  AND 'trs' = ANY(search_terms)
  AND array_length(search_terms, 1) > 1;
