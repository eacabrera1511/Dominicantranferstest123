/*
  # Add Route-Based Pricing Rules
  
  1. Changes
    - Add pricing rules for airport to hotel routes using zone_to_zone type
    - Includes PUJ, SDQ, LRM, POP airports to various destinations
    - Prices for Sedan, SUV, Van, and Bus vehicle types
    - One-way pricing (customers can select round-trip which doubles it)
  
  2. Coverage
    - Punta Cana (PUJ) routes to Bavaro, Cap Cana, Santo Domingo, La Romana
    - Santo Domingo (SDQ) routes to all major destinations
    - La Romana (LRM) routes
    - Puerto Plata (POP) routes
*/

-- Get vehicle type IDs
DO $$
DECLARE
  sedan_id uuid;
  suv_id uuid;
  van_id uuid;
  bus_id uuid;
BEGIN
  SELECT id INTO sedan_id FROM vehicle_types WHERE name = 'Sedan' LIMIT 1;
  SELECT id INTO suv_id FROM vehicle_types WHERE name = 'SUV' LIMIT 1;
  SELECT id INTO van_id FROM vehicle_types WHERE name = 'Van' LIMIT 1;
  SELECT id INTO bus_id FROM vehicle_types WHERE name = 'Bus' LIMIT 1;

  -- PUJ to Bavaro/Punta Cana
  INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, route_name, vehicle_type_id, base_price, price_per_km, is_active, priority)
  VALUES 
    ('PUJ to Bavaro - Sedan', 'zone_to_zone', 'PUJ', 'Bavaro / Punta Cana', 'PUJ to Bavaro', sedan_id, 30, 0, true, 100),
    ('PUJ to Bavaro - SUV', 'zone_to_zone', 'PUJ', 'Bavaro / Punta Cana', 'PUJ to Bavaro', suv_id, 45, 0, true, 100),
    ('PUJ to Bavaro - Van', 'zone_to_zone', 'PUJ', 'Bavaro / Punta Cana', 'PUJ to Bavaro', van_id, 70, 0, true, 100),
    ('PUJ to Bavaro - Bus', 'zone_to_zone', 'PUJ', 'Bavaro / Punta Cana', 'PUJ to Bavaro', bus_id, 120, 0, true, 100);

  -- PUJ to Cap Cana
  INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, route_name, vehicle_type_id, base_price, price_per_km, is_active, priority)
  VALUES 
    ('PUJ to Cap Cana - Sedan', 'zone_to_zone', 'PUJ', 'Cap Cana / Uvero Alto', 'PUJ to Cap Cana', sedan_id, 40, 0, true, 100),
    ('PUJ to Cap Cana - SUV', 'zone_to_zone', 'PUJ', 'Cap Cana / Uvero Alto', 'PUJ to Cap Cana', suv_id, 60, 0, true, 100),
    ('PUJ to Cap Cana - Van', 'zone_to_zone', 'PUJ', 'Cap Cana / Uvero Alto', 'PUJ to Cap Cana', van_id, 90, 0, true, 100),
    ('PUJ to Cap Cana - Bus', 'zone_to_zone', 'PUJ', 'Cap Cana / Uvero Alto', 'PUJ to Cap Cana', bus_id, 150, 0, true, 100);

  -- PUJ to Santo Domingo
  INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, route_name, vehicle_type_id, base_price, price_per_km, is_active, priority)
  VALUES 
    ('PUJ to Santo Domingo - Sedan', 'zone_to_zone', 'PUJ', 'Santo Domingo City', 'PUJ to Santo Domingo', sedan_id, 135, 0, true, 100),
    ('PUJ to Santo Domingo - SUV', 'zone_to_zone', 'PUJ', 'Santo Domingo City', 'PUJ to Santo Domingo', suv_id, 155, 0, true, 100),
    ('PUJ to Santo Domingo - Van', 'zone_to_zone', 'PUJ', 'Santo Domingo City', 'PUJ to Santo Domingo', van_id, 185, 0, true, 100),
    ('PUJ to Santo Domingo - Bus', 'zone_to_zone', 'PUJ', 'Santo Domingo City', 'PUJ to Santo Domingo', bus_id, 240, 0, true, 100);

  -- PUJ to La Romana
  INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, route_name, vehicle_type_id, base_price, price_per_km, is_active, priority)
  VALUES 
    ('PUJ to La Romana - Sedan', 'zone_to_zone', 'PUJ', 'La Romana / Bayahibe', 'PUJ to La Romana', sedan_id, 80, 0, true, 100),
    ('PUJ to La Romana - SUV', 'zone_to_zone', 'PUJ', 'La Romana / Bayahibe', 'PUJ to La Romana', suv_id, 100, 0, true, 100),
    ('PUJ to La Romana - Van', 'zone_to_zone', 'PUJ', 'La Romana / Bayahibe', 'PUJ to La Romana', van_id, 130, 0, true, 100),
    ('PUJ to La Romana - Bus', 'zone_to_zone', 'PUJ', 'La Romana / Bayahibe', 'PUJ to La Romana', bus_id, 190, 0, true, 100);

  -- SDQ to Bavaro
  INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, route_name, vehicle_type_id, base_price, price_per_km, is_active, priority)
  VALUES 
    ('SDQ to Bavaro - Sedan', 'zone_to_zone', 'SDQ', 'Bavaro / Punta Cana', 'SDQ to Bavaro', sedan_id, 130, 0, true, 100),
    ('SDQ to Bavaro - SUV', 'zone_to_zone', 'SDQ', 'Bavaro / Punta Cana', 'SDQ to Bavaro', suv_id, 145, 0, true, 100),
    ('SDQ to Bavaro - Van', 'zone_to_zone', 'SDQ', 'Bavaro / Punta Cana', 'SDQ to Bavaro', van_id, 170, 0, true, 100),
    ('SDQ to Bavaro - Bus', 'zone_to_zone', 'SDQ', 'Bavaro / Punta Cana', 'SDQ to Bavaro', bus_id, 220, 0, true, 100);

  -- LRM to Bavaro
  INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, route_name, vehicle_type_id, base_price, price_per_km, is_active, priority)
  VALUES 
    ('LRM to Bavaro - Sedan', 'zone_to_zone', 'LRM', 'Bavaro / Punta Cana', 'LRM to Bavaro', sedan_id, 80, 0, true, 100),
    ('LRM to Bavaro - SUV', 'zone_to_zone', 'LRM', 'Bavaro / Punta Cana', 'LRM to Bavaro', suv_id, 100, 0, true, 100),
    ('LRM to Bavaro - Van', 'zone_to_zone', 'LRM', 'Bavaro / Punta Cana', 'LRM to Bavaro', van_id, 130, 0, true, 100),
    ('LRM to Bavaro - Bus', 'zone_to_zone', 'LRM', 'Bavaro / Punta Cana', 'LRM to Bavaro', bus_id, 190, 0, true, 100);

  -- POP to Puerto Plata
  INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, route_name, vehicle_type_id, base_price, price_per_km, is_active, priority)
  VALUES 
    ('POP to Puerto Plata - Sedan', 'zone_to_zone', 'POP', 'Puerto Plata / Playa Dorada', 'POP to Puerto Plata', sedan_id, 30, 0, true, 100),
    ('POP to Puerto Plata - SUV', 'zone_to_zone', 'POP', 'Puerto Plata / Playa Dorada', 'POP to Puerto Plata', suv_id, 50, 0, true, 100),
    ('POP to Puerto Plata - Van', 'zone_to_zone', 'POP', 'Puerto Plata / Playa Dorada', 'POP to Puerto Plata', van_id, 80, 0, true, 100),
    ('POP to Puerto Plata - Bus', 'zone_to_zone', 'POP', 'Puerto Plata / Playa Dorada', 'POP to Puerto Plata', bus_id, 130, 0, true, 100);

END $$;
