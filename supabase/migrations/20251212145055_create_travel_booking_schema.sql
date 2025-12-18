/*
  # Travel Booking AI Agent Schema

  1. New Tables
    - `hotels`
      - `id` (uuid, primary key)
      - `name` (text) - Hotel name
      - `location` (text) - City/destination
      - `country` (text) - Country
      - `address` (text) - Full address
      - `description` (text) - Hotel description
      - `price_per_night` (numeric) - Base price
      - `rating` (numeric) - Hotel rating (0-10)
      - `image_url` (text) - Main image
      - `amenities` (jsonb) - Array of amenities
      - `coordinates` (jsonb) - Lat/long coordinates
      - `created_at` (timestamptz)
    
    - `services`
      - `id` (uuid, primary key)
      - `type` (text) - Service type (airport_transfer, car_rental, flight, attraction)
      - `name` (text) - Service name
      - `description` (text) - Service description
      - `location` (text) - Service location
      - `price` (numeric) - Service price
      - `details` (jsonb) - Additional service details
      - `created_at` (timestamptz)
    
    - `conversations`
      - `id` (uuid, primary key)
      - `title` (text) - Conversation title
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key)
      - `role` (text) - 'user' or 'assistant'
      - `content` (text) - Message content
      - `created_at` (timestamptz)
    
    - `bookings`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key)
      - `booking_type` (text) - hotel, transfer, car_rental, etc.
      - `reference_id` (uuid) - ID of booked item
      - `details` (jsonb) - Booking details
      - `status` (text) - pending, confirmed, cancelled
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access (demo purposes)
    - Add policies for authenticated write access
*/

-- Hotels Table
CREATE TABLE IF NOT EXISTS hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  country text NOT NULL,
  address text NOT NULL,
  description text NOT NULL,
  price_per_night numeric NOT NULL,
  rating numeric DEFAULT 0,
  image_url text,
  amenities jsonb DEFAULT '[]'::jsonb,
  coordinates jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hotels"
  ON hotels FOR SELECT
  TO public
  USING (true);

-- Services Table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  price numeric NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view services"
  ON services FOR SELECT
  TO public
  USING (true);

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text DEFAULT 'New Conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view conversations"
  ON conversations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create conversations"
  ON conversations FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update conversations"
  ON conversations FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view messages"
  ON messages FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create messages"
  ON messages FOR INSERT
  TO public
  WITH CHECK (true);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  booking_type text NOT NULL,
  reference_id uuid NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bookings"
  ON bookings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update bookings"
  ON bookings FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);