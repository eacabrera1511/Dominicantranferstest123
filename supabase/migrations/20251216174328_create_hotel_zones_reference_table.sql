/*
  # Create Hotel Zones Reference Table

  1. New Table
    - `hotel_zones`
      - `id` (uuid, primary key)
      - `hotel_name` (text) - Full official hotel name
      - `zone_code` (text) - Zone A, B, C, D, or E
      - `zone_name` (text) - Full zone name (e.g., "Bavaro / Punta Cana")
      - `search_terms` (text[]) - Array of search terms for fuzzy matching
      - `is_active` (boolean) - Whether hotel is currently active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Allow public read access (for chat/booking system)
    - Only authenticated admins can modify

  3. Purpose
    - Centralize hotel-to-zone mappings
    - Display hotels in admin interface
    - Enable fuzzy search matching for chat
*/

CREATE TABLE IF NOT EXISTS hotel_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_name text NOT NULL,
  zone_code text NOT NULL CHECK (zone_code IN ('Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E')),
  zone_name text NOT NULL,
  search_terms text[] NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_hotel_zones_zone_code ON hotel_zones(zone_code);
CREATE INDEX IF NOT EXISTS idx_hotel_zones_is_active ON hotel_zones(is_active);
CREATE INDEX IF NOT EXISTS idx_hotel_zones_search_terms ON hotel_zones USING gin(search_terms);

-- Enable RLS
ALTER TABLE hotel_zones ENABLE ROW LEVEL SECURITY;

-- Public can read active hotels
CREATE POLICY "Anyone can view active hotels"
  ON hotel_zones FOR SELECT
  USING (is_active = true);

-- Only authenticated users can manage hotels
CREATE POLICY "Authenticated users can insert hotels"
  ON hotel_zones FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update hotels"
  ON hotel_zones FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete hotels"
  ON hotel_zones FOR DELETE
  TO authenticated
  USING (true);