/*
  # Resort Brand Resolution System

  1. Purpose
    - Handle resort brands with multiple physical locations
    - Prevent incorrect transfer pricing for multi-property brands
    - Require exact property resolution before vehicle pricing

  2. Changes
    - Add brand_name column to hotel_zones table
    - Create resort_brand_requires_resolution tracking
    - Add property resolution validation

  3. Security
    - Public read access for brand validation
    - No authentication required for lookups
*/

-- Add brand_name to hotel_zones table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hotel_zones' AND column_name = 'brand_name'
  ) THEN
    ALTER TABLE hotel_zones ADD COLUMN brand_name TEXT;
  END IF;
END $$;

-- Add requires_property_resolution flag
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hotel_zones' AND column_name = 'requires_resolution'
  ) THEN
    ALTER TABLE hotel_zones ADD COLUMN requires_resolution BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add resort_property_id to bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'resort_property_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN resort_property_id UUID REFERENCES hotel_zones(id);
  END IF;
END $$;

-- Add property_resolved flag to bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'property_resolved'
  ) THEN
    ALTER TABLE bookings ADD COLUMN property_resolved BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Update existing resort properties with their brand names
-- Bahia Principe properties
UPDATE hotel_zones SET brand_name = 'Bahia Principe', requires_resolution = false WHERE hotel_name = 'Bahia Principe Fantasia';

-- RIU properties
UPDATE hotel_zones SET brand_name = 'RIU Hotels & Resorts', requires_resolution = false WHERE hotel_name IN ('RIU Palace Bavaro', 'RIU Palace Punta Cana', 'RIU Republica');

-- Barceló properties
UPDATE hotel_zones SET brand_name = 'Barceló Hotels & Resorts', requires_resolution = false WHERE hotel_name IN ('Barceló Bávaro Palace', 'Barceló Bávaro Beach', 'Barceló Santo Domingo');

-- Iberostar properties
UPDATE hotel_zones SET brand_name = 'Iberostar Hotels & Resorts', requires_resolution = false WHERE hotel_name IN ('Iberostar Selection Bavaro', 'Iberostar Hacienda Dominicus');

-- Palladium Group properties
UPDATE hotel_zones SET brand_name = 'Palladium Hotel Group', requires_resolution = false WHERE hotel_name IN ('Grand Palladium Bavaro', 'TRS Turquesa', 'TRS Cap Cana');

-- Dreams properties
UPDATE hotel_zones SET brand_name = 'Dreams Resorts & Spa', requires_resolution = false WHERE hotel_name IN ('Dreams Royal Beach', 'Dreams Macao Beach', 'Dreams Dominicus', 'Dreams Cap Cana');

-- Secrets properties
UPDATE hotel_zones SET brand_name = 'Secrets Resorts & Spas', requires_resolution = false WHERE hotel_name IN ('Secrets Royal Beach', 'Secrets Cap Cana');

-- Excellence Collection
UPDATE hotel_zones SET brand_name = 'Excellence Collection', requires_resolution = false WHERE hotel_name = 'Excellence Punta Cana';

-- Meliá / Paradisus properties
UPDATE hotel_zones SET brand_name = 'Meliá Hotels International', requires_resolution = false WHERE hotel_name IN ('Melia Caribe Beach', 'Melia Punta Cana', 'Paradisus Palma Real', 'Paradisus Grand Cana');

-- Occidental properties
UPDATE hotel_zones SET brand_name = 'Occidental Hotels & Resorts', requires_resolution = false WHERE hotel_name = 'Occidental Punta Cana';

-- Catalonia properties
UPDATE hotel_zones SET brand_name = 'Catalonia Hotels & Resorts', requires_resolution = false WHERE hotel_name = 'Catalonia Royal La Romana';

-- Royalton properties
UPDATE hotel_zones SET brand_name = 'Royalton', requires_resolution = false WHERE hotel_name IN ('Royalton Bavaro', 'Royalton Punta Cana', 'Royalton Splash');

-- Lopesan properties
UPDATE hotel_zones SET brand_name = 'Lopesan', requires_resolution = false WHERE hotel_name = 'Lopesan Costa Bávaro';

-- Majestic properties
UPDATE hotel_zones SET brand_name = 'Majestic Resorts', requires_resolution = false WHERE hotel_name IN ('Majestic Mirage', 'Majestic Colonial', 'Majestic Elegance');

-- Viva Wyndham properties
UPDATE hotel_zones SET brand_name = 'Viva Wyndham', requires_resolution = false WHERE hotel_name = 'Viva Wyndham Dominicus';

-- Nickelodeon properties
UPDATE hotel_zones SET brand_name = 'Nickelodeon Hotels & Resorts', requires_resolution = false WHERE hotel_name = 'Nickelodeon Resort';

-- Add brand names to search terms for better matching
UPDATE hotel_zones SET search_terms = array_append(search_terms, 'bahia principe') WHERE brand_name = 'Bahia Principe';
UPDATE hotel_zones SET search_terms = array_append(search_terms, 'riu') WHERE brand_name = 'RIU Hotels & Resorts';
UPDATE hotel_zones SET search_terms = array_append(search_terms, 'barcelo') WHERE brand_name = 'Barceló Hotels & Resorts';
UPDATE hotel_zones SET search_terms = array_append(search_terms, 'iberostar') WHERE brand_name = 'Iberostar Hotels & Resorts';
UPDATE hotel_zones SET search_terms = array_append(search_terms, 'palladium') WHERE brand_name = 'Palladium Hotel Group';
UPDATE hotel_zones SET search_terms = array_append(search_terms, 'dreams') WHERE brand_name = 'Dreams Resorts & Spa';
UPDATE hotel_zones SET search_terms = array_append(search_terms, 'secrets') WHERE brand_name = 'Secrets Resorts & Spas';
UPDATE hotel_zones SET search_terms = array_append(search_terms, 'excellence') WHERE brand_name = 'Excellence Collection';
UPDATE hotel_zones SET search_terms = array_append(search_terms, 'melia') WHERE brand_name = 'Meliá Hotels International';
UPDATE hotel_zones SET search_terms = array_append(search_terms, 'paradisus') WHERE brand_name = 'Meliá Hotels International';
UPDATE hotel_zones SET search_terms = array_append(search_terms, 'occidental') WHERE brand_name = 'Occidental Hotels & Resorts';
UPDATE hotel_zones SET search_terms = array_append(search_terms, 'catalonia') WHERE brand_name = 'Catalonia Hotels & Resorts';
UPDATE hotel_zones SET search_terms = array_append(search_terms, 'royalton') WHERE brand_name = 'Royalton';
UPDATE hotel_zones SET search_terms = array_append(search_terms, 'lopesan') WHERE brand_name = 'Lopesan';
UPDATE hotel_zones SET search_terms = array_append(search_terms, 'majestic') WHERE brand_name = 'Majestic Resorts';
UPDATE hotel_zones SET search_terms = array_append(search_terms, 'viva wyndham') WHERE brand_name = 'Viva Wyndham';
UPDATE hotel_zones SET search_terms = array_append(search_terms, 'nickelodeon') WHERE brand_name = 'Nickelodeon Hotels & Resorts';

-- Create function to check if a brand name requires property resolution
CREATE OR REPLACE FUNCTION check_brand_requires_resolution(input_text TEXT)
RETURNS TABLE (
  requires_resolution BOOLEAN,
  brand_name TEXT,
  matching_properties JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  brand_names TEXT[] := ARRAY[
    'Bahia Principe',
    'RIU Hotels & Resorts',
    'RIU',
    'Barceló Hotels & Resorts',
    'Barceló',
    'Barcelo',
    'Iberostar Hotels & Resorts',
    'Iberostar',
    'Palladium Hotel Group',
    'Palladium',
    'Grand Palladium',
    'TRS',
    'Dreams Resorts & Spa',
    'Dreams',
    'Secrets Resorts & Spas',
    'Secrets',
    'Excellence Collection',
    'Excellence',
    'Meliá Hotels International',
    'Meliá',
    'Melia',
    'Paradisus',
    'Occidental Hotels & Resorts',
    'Occidental',
    'Catalonia Hotels & Resorts',
    'Catalonia',
    'Royalton',
    'Lopesan',
    'Majestic Resorts',
    'Majestic',
    'Viva Wyndham',
    'Nickelodeon Hotels & Resorts',
    'Nickelodeon'
  ];
  brand TEXT;
  property_count INTEGER;
  matched_brand TEXT;
  properties JSONB;
BEGIN
  -- Check if input matches any brand name
  FOREACH brand IN ARRAY brand_names LOOP
    IF LOWER(input_text) LIKE '%' || LOWER(brand) || '%' THEN
      -- Count how many properties this brand has
      SELECT COUNT(*)::INTEGER INTO property_count
      FROM hotel_zones
      WHERE LOWER(brand_name) LIKE '%' || LOWER(brand) || '%'
        AND is_active = true;

      IF property_count > 1 THEN
        -- Multiple properties found - resolution required
        matched_brand := brand;

        -- Get all matching properties
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', id,
            'property_name', hotel_name,
            'zone', zone_name,
            'zone_code', zone_code
          )
        ) INTO properties
        FROM hotel_zones
        WHERE LOWER(brand_name) LIKE '%' || LOWER(brand) || '%'
          AND is_active = true;

        RETURN QUERY SELECT true, matched_brand, properties;
        RETURN;
      ELSIF property_count = 1 THEN
        -- Only one property - no resolution needed
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', id,
            'property_name', hotel_name,
            'zone', zone_name,
            'zone_code', zone_code
          )
        ) INTO properties
        FROM hotel_zones
        WHERE LOWER(brand_name) LIKE '%' || LOWER(brand) || '%'
          AND is_active = true;

        RETURN QUERY SELECT false, brand, properties;
        RETURN;
      END IF;
    END IF;
  END LOOP;

  -- No brand match - check if it's a specific property
  SELECT COUNT(*)::INTEGER INTO property_count
  FROM hotel_zones
  WHERE (
    hotel_name ILIKE '%' || input_text || '%'
    OR input_text ILIKE '%' || hotel_name || '%'
  ) AND is_active = true;

  IF property_count > 0 THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'property_name', hotel_name,
        'zone', zone_name,
        'zone_code', zone_code,
        'brand', brand_name
      )
    ) INTO properties
    FROM hotel_zones
    WHERE (
      hotel_name ILIKE '%' || input_text || '%'
      OR input_text ILIKE '%' || hotel_name || '%'
    ) AND is_active = true;

    RETURN QUERY SELECT false, NULL::TEXT, properties;
    RETURN;
  END IF;

  -- No match found
  RETURN QUERY SELECT false, NULL::TEXT, NULL::JSONB;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_brand_requires_resolution(TEXT) TO anon, authenticated;

-- Create index for faster brand lookups
CREATE INDEX IF NOT EXISTS idx_hotel_zones_brand_name ON hotel_zones(brand_name);
CREATE INDEX IF NOT EXISTS idx_hotel_zones_search_terms_gin ON hotel_zones USING gin(search_terms);

-- Add comment
COMMENT ON COLUMN hotel_zones.brand_name IS 'Resort brand name for multi-property resolution';
COMMENT ON COLUMN hotel_zones.requires_resolution IS 'Whether this property requires disambiguation from other brand properties';
COMMENT ON COLUMN bookings.resort_property_id IS 'Resolved hotel property ID';
COMMENT ON COLUMN bookings.property_resolved IS 'Whether the exact resort property has been resolved';
COMMENT ON FUNCTION check_brand_requires_resolution(TEXT) IS 'Checks if a hotel input requires property-level resolution before pricing';
