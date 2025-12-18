/*
  # Add PUJ to Bavaro Hotels Stripe Product Mappings

  1. New Route Mappings
    - PUJ Airport → Bavaro (One Way Sedan)
    - PUJ Airport → Bavaro (Roundtrip Sedan)
    - Bavaro → PUJ Airport (One Way Sedan)
    - Bavaro → PUJ Airport (Roundtrip Sedan)

  2. All mappings use:
    - Product ID: prod_TbrKnqV1OmDfTq
    - Price ID: price_1SedcI0KWGGTwByYyi03DXfu
*/

-- PUJ to Bavaro (One Way)
INSERT INTO stripe_product_mappings (
  route_key,
  route_name,
  price_id,
  product_id,
  amount,
  currency,
  trip_type,
  origin,
  destination,
  active
) VALUES (
  'puj_airport-bavaro-oneway',
  'PUJ Airport to Bavaro (One Way)',
  'price_1SedcI0KWGGTwByYyi03DXfu',
  'prod_TbrKnqV1OmDfTq',
  0,
  'USD',
  'oneway',
  'PUJ Airport',
  'Bavaro',
  true
) ON CONFLICT (route_key) DO UPDATE SET
  price_id = EXCLUDED.price_id,
  product_id = EXCLUDED.product_id,
  active = EXCLUDED.active;

-- PUJ to Bavaro (Roundtrip)
INSERT INTO stripe_product_mappings (
  route_key,
  route_name,
  price_id,
  product_id,
  amount,
  currency,
  trip_type,
  origin,
  destination,
  active
) VALUES (
  'puj_airport-bavaro-roundtrip',
  'PUJ Airport to Bavaro (Roundtrip)',
  'price_1SedcI0KWGGTwByYyi03DXfu',
  'prod_TbrKnqV1OmDfTq',
  0,
  'USD',
  'roundtrip',
  'PUJ Airport',
  'Bavaro',
  true
) ON CONFLICT (route_key) DO UPDATE SET
  price_id = EXCLUDED.price_id,
  product_id = EXCLUDED.product_id,
  active = EXCLUDED.active;

-- Bavaro to PUJ (One Way)
INSERT INTO stripe_product_mappings (
  route_key,
  route_name,
  price_id,
  product_id,
  amount,
  currency,
  trip_type,
  origin,
  destination,
  active
) VALUES (
  'bavaro-puj_airport-oneway',
  'Bavaro to PUJ Airport (One Way)',
  'price_1SedcI0KWGGTwByYyi03DXfu',
  'prod_TbrKnqV1OmDfTq',
  0,
  'USD',
  'oneway',
  'Bavaro',
  'PUJ Airport',
  true
) ON CONFLICT (route_key) DO UPDATE SET
  price_id = EXCLUDED.price_id,
  product_id = EXCLUDED.product_id,
  active = EXCLUDED.active;

-- Bavaro to PUJ (Roundtrip)
INSERT INTO stripe_product_mappings (
  route_key,
  route_name,
  price_id,
  product_id,
  amount,
  currency,
  trip_type,
  origin,
  destination,
  active
) VALUES (
  'bavaro-puj_airport-roundtrip',
  'Bavaro to PUJ Airport (Roundtrip)',
  'price_1SedcI0KWGGTwByYyi03DXfu',
  'prod_TbrKnqV1OmDfTq',
  0,
  'USD',
  'roundtrip',
  'Bavaro',
  'PUJ Airport',
  true
) ON CONFLICT (route_key) DO UPDATE SET
  price_id = EXCLUDED.price_id,
  product_id = EXCLUDED.product_id,
  active = EXCLUDED.active;

-- Punta Cana International Airport to Bavaro (One Way)
INSERT INTO stripe_product_mappings (
  route_key,
  route_name,
  price_id,
  product_id,
  amount,
  currency,
  trip_type,
  origin,
  destination,
  active
) VALUES (
  'punta_cana_international_airport-bavaro-oneway',
  'Punta Cana International Airport to Bavaro (One Way)',
  'price_1SedcI0KWGGTwByYyi03DXfu',
  'prod_TbrKnqV1OmDfTq',
  0,
  'USD',
  'oneway',
  'Punta Cana International Airport',
  'Bavaro',
  true
) ON CONFLICT (route_key) DO UPDATE SET
  price_id = EXCLUDED.price_id,
  product_id = EXCLUDED.product_id,
  active = EXCLUDED.active;

-- Punta Cana International Airport to Bavaro (Roundtrip)
INSERT INTO stripe_product_mappings (
  route_key,
  route_name,
  price_id,
  product_id,
  amount,
  currency,
  trip_type,
  origin,
  destination,
  active
) VALUES (
  'punta_cana_international_airport-bavaro-roundtrip',
  'Punta Cana International Airport to Bavaro (Roundtrip)',
  'price_1SedcI0KWGGTwByYyi03DXfu',
  'prod_TbrKnqV1OmDfTq',
  0,
  'USD',
  'roundtrip',
  'Punta Cana International Airport',
  'Bavaro',
  true
) ON CONFLICT (route_key) DO UPDATE SET
  price_id = EXCLUDED.price_id,
  product_id = EXCLUDED.product_id,
  active = EXCLUDED.active;

-- Bavaro to Punta Cana International Airport (One Way)
INSERT INTO stripe_product_mappings (
  route_key,
  route_name,
  price_id,
  product_id,
  amount,
  currency,
  trip_type,
  origin,
  destination,
  active
) VALUES (
  'bavaro-punta_cana_international_airport-oneway',
  'Bavaro to Punta Cana International Airport (One Way)',
  'price_1SedcI0KWGGTwByYyi03DXfu',
  'prod_TbrKnqV1OmDfTq',
  0,
  'USD',
  'oneway',
  'Bavaro',
  'Punta Cana International Airport',
  true
) ON CONFLICT (route_key) DO UPDATE SET
  price_id = EXCLUDED.price_id,
  product_id = EXCLUDED.product_id,
  active = EXCLUDED.active;

-- Bavaro to Punta Cana International Airport (Roundtrip)
INSERT INTO stripe_product_mappings (
  route_key,
  route_name,
  price_id,
  product_id,
  amount,
  currency,
  trip_type,
  origin,
  destination,
  active
) VALUES (
  'bavaro-punta_cana_international_airport-roundtrip',
  'Bavaro to Punta Cana International Airport (Roundtrip)',
  'price_1SedcI0KWGGTwByYyi03DXfu',
  'prod_TbrKnqV1OmDfTq',
  0,
  'USD',
  'roundtrip',
  'Bavaro',
  'Punta Cana International Airport',
  true
) ON CONFLICT (route_key) DO UPDATE SET
  price_id = EXCLUDED.price_id,
  product_id = EXCLUDED.product_id,
  active = EXCLUDED.active;
