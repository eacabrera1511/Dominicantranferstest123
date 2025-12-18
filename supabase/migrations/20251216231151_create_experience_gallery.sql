/*
  # Create Experience Gallery System

  1. New Tables
    - `experience_gallery`
      - `id` (uuid, primary key)
      - `title` (text) - Title/caption for the media
      - `description` (text) - Optional longer description
      - `media_url` (text) - URL to the photo/video
      - `media_type` (text) - 'photo' or 'video'
      - `category` (text) - 'fleet', 'punta_cana', 'drivers', 'reviews'
      - `is_active` (boolean) - Whether to show this item
      - `display_order` (integer) - Order to display items
      - `uploaded_by` (text) - Admin who uploaded
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `experience_gallery` table
    - Public users can only read active items
    - Authenticated users can manage all items
*/

CREATE TABLE IF NOT EXISTS experience_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('photo', 'video')),
  category text NOT NULL CHECK (category IN ('fleet', 'punta_cana', 'drivers', 'reviews', 'general')),
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  uploaded_by text DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE experience_gallery ENABLE ROW LEVEL SECURITY;

-- Public users can view active items
CREATE POLICY "Public can view active gallery items"
  ON experience_gallery FOR SELECT
  TO public
  USING (is_active = true);

-- Authenticated users can view all items
CREATE POLICY "Authenticated users can view all gallery items"
  ON experience_gallery FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert items
CREATE POLICY "Authenticated users can insert gallery items"
  ON experience_gallery FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update items
CREATE POLICY "Authenticated users can update gallery items"
  ON experience_gallery FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete items
CREATE POLICY "Authenticated users can delete gallery items"
  ON experience_gallery FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_experience_gallery_category ON experience_gallery(category);
CREATE INDEX IF NOT EXISTS idx_experience_gallery_active ON experience_gallery(is_active);
CREATE INDEX IF NOT EXISTS idx_experience_gallery_order ON experience_gallery(display_order);

-- Seed some initial data
INSERT INTO experience_gallery (title, description, media_url, media_type, category, display_order) VALUES
  ('Luxury SUV Fleet', 'Our premium SUVs for comfortable transfers', 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=800', 'photo', 'fleet', 1),
  ('Spacious Van', 'Perfect for groups and families', 'https://images.pexels.com/photos/2526127/pexels-photo-2526127.jpeg?auto=compress&cs=tinysrgb&w=800', 'photo', 'fleet', 2),
  ('Beautiful Punta Cana Beach', 'Paradise awaits you', 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800', 'photo', 'punta_cana', 3),
  ('Professional Drivers', 'Experienced and friendly team', 'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=800', 'photo', 'drivers', 4),
  ('Bavaro Beach Resort Area', 'Stunning coastal views', 'https://images.pexels.com/photos/1287460/pexels-photo-1287460.jpeg?auto=compress&cs=tinysrgb&w=800', 'photo', 'punta_cana', 5),
  ('Mercedes-Benz Luxury', 'Premium comfort for VIP transfers', 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=800', 'photo', 'fleet', 6)
ON CONFLICT DO NOTHING;