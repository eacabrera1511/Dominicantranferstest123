/*
  # Seed Fleet Vehicles
  
  1. Changes
    - Add sample vehicles to the fleet for each vehicle type
    - Include realistic vehicle details with images
    - Set vehicles as available for booking
  
  2. Vehicles Added
    - Multiple sedans, SUVs, vans, and buses
    - Each with make, model, year, capacity details
    - Stock photos from Pexels for vehicle images
*/

DO $$
DECLARE
  sedan_type_id uuid;
  suv_type_id uuid;
  van_type_id uuid;
  bus_type_id uuid;
BEGIN
  SELECT id INTO sedan_type_id FROM vehicle_types WHERE name = 'Sedan' LIMIT 1;
  SELECT id INTO suv_type_id FROM vehicle_types WHERE name = 'SUV' LIMIT 1;
  SELECT id INTO van_type_id FROM vehicle_types WHERE name = 'Van' LIMIT 1;
  SELECT id INTO bus_type_id FROM vehicle_types WHERE name = 'Bus' LIMIT 1;

  -- Sedans
  INSERT INTO vehicles (vehicle_type_id, make, model, year, color, license_plate, capacity, luggage_capacity, status, fuel_type, image_url, amenities)
  VALUES 
    (sedan_type_id, 'Toyota', 'Camry', 2023, 'Black', 'PUJ-1001', 4, 2, 'available', 'gasoline', 
     'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=1200', 
     '["Air Conditioning", "USB Charging", "WiFi"]'::jsonb),
    (sedan_type_id, 'Honda', 'Accord', 2023, 'Silver', 'PUJ-1002', 4, 2, 'available', 'gasoline',
     'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=1200',
     '["Air Conditioning", "USB Charging", "WiFi"]'::jsonb),
    (sedan_type_id, 'Nissan', 'Altima', 2022, 'White', 'SDQ-2001', 4, 2, 'available', 'gasoline',
     'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=1200',
     '["Air Conditioning", "USB Charging"]'::jsonb);

  -- SUVs
  INSERT INTO vehicles (vehicle_type_id, make, model, year, color, license_plate, capacity, luggage_capacity, status, fuel_type, image_url, amenities)
  VALUES 
    (suv_type_id, 'Toyota', 'Highlander', 2023, 'Black', 'PUJ-3001', 6, 4, 'available', 'gasoline',
     'https://images.pexels.com/photos/13861/IMG_3496bfree.jpg?auto=compress&cs=tinysrgb&w=1200',
     '["Air Conditioning", "USB Charging", "WiFi", "Leather Seats"]'::jsonb),
    (suv_type_id, 'Chevrolet', 'Suburban', 2023, 'Silver', 'PUJ-3002', 6, 4, 'available', 'gasoline',
     'https://images.pexels.com/photos/13861/IMG_3496bfree.jpg?auto=compress&cs=tinysrgb&w=1200',
     '["Air Conditioning", "USB Charging", "WiFi", "Premium Sound"]'::jsonb),
    (suv_type_id, 'Ford', 'Explorer', 2022, 'Blue', 'SDQ-4001', 6, 4, 'available', 'gasoline',
     'https://images.pexels.com/photos/13861/IMG_3496bfree.jpg?auto=compress&cs=tinysrgb&w=1200',
     '["Air Conditioning", "USB Charging", "WiFi"]'::jsonb);

  -- Vans
  INSERT INTO vehicles (vehicle_type_id, make, model, year, color, license_plate, capacity, luggage_capacity, status, fuel_type, image_url, amenities)
  VALUES 
    (van_type_id, 'Mercedes-Benz', 'Sprinter', 2023, 'White', 'PUJ-5001', 8, 6, 'available', 'diesel',
     'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=1200',
     '["Air Conditioning", "USB Charging", "WiFi", "Reclining Seats", "Entertainment System"]'::jsonb),
    (van_type_id, 'Toyota', 'Hiace', 2023, 'Silver', 'PUJ-5002', 8, 6, 'available', 'diesel',
     'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=1200',
     '["Air Conditioning", "USB Charging", "WiFi", "Comfortable Seating"]'::jsonb),
    (van_type_id, 'Ford', 'Transit', 2022, 'White', 'SDQ-6001', 8, 6, 'available', 'diesel',
     'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=1200',
     '["Air Conditioning", "USB Charging", "WiFi"]'::jsonb);

  -- Buses
  INSERT INTO vehicles (vehicle_type_id, make, model, year, color, license_plate, capacity, luggage_capacity, status, fuel_type, image_url, amenities)
  VALUES 
    (bus_type_id, 'Mercedes-Benz', 'Tourismo', 2023, 'White', 'PUJ-7001', 20, 15, 'available', 'diesel',
     'https://images.pexels.com/photos/385998/pexels-photo-385998.jpeg?auto=compress&cs=tinysrgb&w=1200',
     '["Air Conditioning", "USB Charging", "WiFi", "Reclining Seats", "Entertainment System", "Restroom"]'::jsonb),
    (bus_type_id, 'Volvo', '9700', 2023, 'Silver', 'PUJ-7002', 20, 15, 'available', 'diesel',
     'https://images.pexels.com/photos/385998/pexels-photo-385998.jpeg?auto=compress&cs=tinysrgb&w=1200',
     '["Air Conditioning", "USB Charging", "WiFi", "Premium Seating", "Entertainment System"]'::jsonb);

END $$;
