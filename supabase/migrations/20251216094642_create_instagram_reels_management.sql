/*
  # Instagram Reels/Highlights Management

  1. New Tables
    - `instagram_highlights`
      - `id` (uuid, primary key)
      - `title` (text) - Name of the highlight/reel
      - `cover_image` (text) - URL for the cover image
      - `instagram_url` (text) - Link to Instagram
      - `sort_order` (integer) - For ordering highlights
      - `is_active` (boolean) - Whether to display
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `instagram_stories`
      - `id` (uuid, primary key)
      - `highlight_id` (uuid, foreign key) - Reference to parent highlight
      - `media_url` (text) - URL for the photo/video
      - `media_type` (text) - 'image' or 'video'
      - `caption` (text) - Optional caption
      - `sort_order` (integer) - For ordering within highlight
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Public read access (anyone can view highlights)
    - Authenticated users can manage (for admin)
*/

CREATE TABLE IF NOT EXISTS instagram_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  cover_image text NOT NULL,
  instagram_url text DEFAULT 'https://www.instagram.com/dominicantransfers/',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS instagram_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id uuid NOT NULL REFERENCES instagram_highlights(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  caption text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instagram_highlights_active ON instagram_highlights(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_instagram_stories_highlight ON instagram_stories(highlight_id, sort_order);

ALTER TABLE instagram_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active highlights"
  ON instagram_highlights
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view stories"
  ON instagram_stories
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage highlights"
  ON instagram_highlights
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage stories"
  ON instagram_stories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can manage highlights"
  ON instagram_highlights
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can manage stories"
  ON instagram_stories
  FOR ALL
  USING (true)
  WITH CHECK (true);

INSERT INTO instagram_highlights (title, cover_image, sort_order) VALUES
  ('Fleet', 'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=400', 1),
  ('Punta Cana', 'https://images.pexels.com/photos/1174732/pexels-photo-1174732.jpeg?auto=compress&cs=tinysrgb&w=400', 2),
  ('Reviews', 'https://images.pexels.com/photos/7129700/pexels-photo-7129700.jpeg?auto=compress&cs=tinysrgb&w=400', 3),
  ('Drivers', 'https://images.pexels.com/photos/5835359/pexels-photo-5835359.jpeg?auto=compress&cs=tinysrgb&w=400', 4),
  ('Excursions', 'https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg?auto=compress&cs=tinysrgb&w=400', 5);

INSERT INTO instagram_stories (highlight_id, media_url, caption, sort_order)
SELECT id, 'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=800', 'Mercedes-Benz V-Class', 1 FROM instagram_highlights WHERE title = 'Fleet'
UNION ALL
SELECT id, 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=800', 'Luxury SUV Fleet', 2 FROM instagram_highlights WHERE title = 'Fleet'
UNION ALL
SELECT id, 'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=800', 'Executive Sedans', 3 FROM instagram_highlights WHERE title = 'Fleet'
UNION ALL
SELECT id, 'https://images.pexels.com/photos/1174732/pexels-photo-1174732.jpeg?auto=compress&cs=tinysrgb&w=800', 'Bavaro Beach', 1 FROM instagram_highlights WHERE title = 'Punta Cana'
UNION ALL
SELECT id, 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800', 'Paradise Found', 2 FROM instagram_highlights WHERE title = 'Punta Cana'
UNION ALL
SELECT id, 'https://images.pexels.com/photos/1430677/pexels-photo-1430677.jpeg?auto=compress&cs=tinysrgb&w=800', 'Crystal Clear Waters', 3 FROM instagram_highlights WHERE title = 'Punta Cana'
UNION ALL
SELECT id, 'https://images.pexels.com/photos/7129700/pexels-photo-7129700.jpeg?auto=compress&cs=tinysrgb&w=800', '5-Star Service', 1 FROM instagram_highlights WHERE title = 'Reviews'
UNION ALL
SELECT id, 'https://images.pexels.com/photos/3184416/pexels-photo-3184416.jpeg?auto=compress&cs=tinysrgb&w=800', 'Happy Travelers', 2 FROM instagram_highlights WHERE title = 'Reviews'
UNION ALL
SELECT id, 'https://images.pexels.com/photos/5835359/pexels-photo-5835359.jpeg?auto=compress&cs=tinysrgb&w=800', 'Professional Team', 1 FROM instagram_highlights WHERE title = 'Drivers'
UNION ALL
SELECT id, 'https://images.pexels.com/photos/4391470/pexels-photo-4391470.jpeg?auto=compress&cs=tinysrgb&w=800', 'Licensed & Insured', 2 FROM instagram_highlights WHERE title = 'Drivers'
UNION ALL
SELECT id, 'https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg?auto=compress&cs=tinysrgb&w=800', 'Saona Island', 1 FROM instagram_highlights WHERE title = 'Excursions'
UNION ALL
SELECT id, 'https://images.pexels.com/photos/1450372/pexels-photo-1450372.jpeg?auto=compress&cs=tinysrgb&w=800', 'Catamaran Tours', 2 FROM instagram_highlights WHERE title = 'Excursions'
UNION ALL
SELECT id, 'https://images.pexels.com/photos/994605/pexels-photo-994605.jpeg?auto=compress&cs=tinysrgb&w=800', 'Adventure Awaits', 3 FROM instagram_highlights WHERE title = 'Excursions';
