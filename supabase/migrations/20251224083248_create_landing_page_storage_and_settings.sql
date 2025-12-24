/*
  # Landing Page Storage and Video Settings

  1. New Storage
    - `landing-videos` bucket for hero video uploads
    - Public access for video files

  2. New Tables
    - `landing_page_settings`
      - `id` (uuid, primary key)
      - `hero_video_url` (text)
      - `hero_video_poster_url` (text) - thumbnail/poster image
      - `hero_title` (text)
      - `hero_subtitle` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  3. Security
    - Enable RLS on settings table
    - Public read access for active settings
    - Admin-only write access
    - Public storage bucket for videos
*/

-- Create storage bucket for landing page videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'landing-videos',
  'landing-videos',
  true,
  104857600,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create landing page settings table
CREATE TABLE IF NOT EXISTS landing_page_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_video_url text,
  hero_video_poster_url text,
  hero_title text DEFAULT 'Punta Cana Airport Transfer From $25',
  hero_subtitle text DEFAULT 'Private Airport Pickup • No Waiting • Fixed Prices',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE landing_page_settings ENABLE ROW LEVEL SECURITY;

-- Public can read active settings
CREATE POLICY "Anyone can view active landing page settings"
  ON landing_page_settings
  FOR SELECT
  USING (is_active = true);

-- Only authenticated users can manage settings (admin check in app layer)
CREATE POLICY "Authenticated users can manage landing page settings"
  ON landing_page_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default settings
INSERT INTO landing_page_settings (hero_title, hero_subtitle, is_active)
VALUES (
  'Punta Cana Airport Transfer From $25',
  'Private Airport Pickup • No Waiting • Fixed Prices',
  true
)
ON CONFLICT DO NOTHING;

-- Storage policies for landing-videos bucket
CREATE POLICY "Public can view landing videos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'landing-videos');

CREATE POLICY "Authenticated users can upload landing videos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'landing-videos');

CREATE POLICY "Authenticated users can update landing videos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'landing-videos');

CREATE POLICY "Authenticated users can delete landing videos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'landing-videos');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_landing_page_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_landing_page_settings_updated_at_trigger ON landing_page_settings;
CREATE TRIGGER update_landing_page_settings_updated_at_trigger
  BEFORE UPDATE ON landing_page_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_landing_page_settings_updated_at();
