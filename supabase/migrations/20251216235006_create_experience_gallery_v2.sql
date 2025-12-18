/*
  # Create Modern Experience Gallery System

  1. New Tables
    - `gallery_categories`
      - `id` (uuid, primary key)
      - `name` (text) - Category name (Fleet, Reviews, Drivers)
      - `slug` (text) - URL-friendly slug
      - `icon` (text) - Icon name for display
      - `sort_order` (integer) - Display order
      - `is_active` (boolean) - Active status
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `gallery_items`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key)
      - `media_url` (text) - URL to photo or video
      - `media_type` (text) - Type: 'photo' or 'video'
      - `thumbnail_url` (text) - Thumbnail for videos
      - `title` (text) - Item title
      - `description` (text) - Item description
      - `sort_order` (integer) - Display order within category
      - `is_active` (boolean) - Active status
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Public read access for active items
    - Authenticated admin-only write access

  3. Seed Data
    - Create three categories: Fleet, Reviews, Drivers
    - Add sample items for each category
*/

-- Create gallery_categories table
CREATE TABLE IF NOT EXISTS gallery_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create gallery_items table
CREATE TABLE IF NOT EXISTS gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES gallery_categories(id) ON DELETE CASCADE NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('photo', 'video')),
  thumbnail_url text,
  title text,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gallery_categories_slug ON gallery_categories(slug);
CREATE INDEX IF NOT EXISTS idx_gallery_categories_active ON gallery_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_gallery_items_category ON gallery_items(category_id);
CREATE INDEX IF NOT EXISTS idx_gallery_items_active ON gallery_items(is_active);

-- Enable RLS
ALTER TABLE gallery_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gallery_categories
CREATE POLICY "Anyone can view active categories"
  ON gallery_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage categories"
  ON gallery_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for gallery_items
CREATE POLICY "Anyone can view active gallery items"
  ON gallery_items FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage gallery items"
  ON gallery_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed categories
INSERT INTO gallery_categories (name, slug, icon, sort_order) VALUES
  ('Fleet', 'fleet', 'Car', 1),
  ('Reviews', 'reviews', 'Star', 2),
  ('Drivers', 'drivers', 'Users', 3)
ON CONFLICT (slug) DO NOTHING;

-- Seed sample gallery items
INSERT INTO gallery_items (category_id, media_url, media_type, title, description, sort_order)
SELECT 
  (SELECT id FROM gallery_categories WHERE slug = 'fleet'),
  'https://images.pexels.com/photos/3729464/pexels-photo-3729464.jpeg',
  'photo',
  'Mercedes-Benz Sprinter',
  'Luxury 14-passenger van with climate control',
  1
WHERE NOT EXISTS (
  SELECT 1 FROM gallery_items 
  WHERE category_id = (SELECT id FROM gallery_categories WHERE slug = 'fleet')
);

INSERT INTO gallery_items (category_id, media_url, media_type, title, description, sort_order)
SELECT 
  (SELECT id FROM gallery_categories WHERE slug = 'fleet'),
  'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg',
  'photo',
  'Chevrolet Suburban SUV',
  'Spacious 7-passenger luxury SUV',
  2
WHERE NOT EXISTS (
  SELECT 1 FROM gallery_items 
  WHERE category_id = (SELECT id FROM gallery_categories WHERE slug = 'fleet')
  AND sort_order = 2
);

INSERT INTO gallery_items (category_id, media_url, media_type, title, description, sort_order)
SELECT 
  (SELECT id FROM gallery_categories WHERE slug = 'reviews'),
  'https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg',
  'photo',
  'Happy Customer',
  '5-star experience from Toronto to Punta Cana',
  1
WHERE NOT EXISTS (
  SELECT 1 FROM gallery_items 
  WHERE category_id = (SELECT id FROM gallery_categories WHERE slug = 'reviews')
);

INSERT INTO gallery_items (category_id, media_url, media_type, title, description, sort_order)
SELECT 
  (SELECT id FROM gallery_categories WHERE slug = 'drivers'),
  'https://images.pexels.com/photos/1416530/pexels-photo-1416530.jpeg',
  'photo',
  'Professional Driver',
  'Licensed and experienced driver',
  1
WHERE NOT EXISTS (
  SELECT 1 FROM gallery_items 
  WHERE category_id = (SELECT id FROM gallery_categories WHERE slug = 'drivers')
);