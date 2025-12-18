/*
  # Add image_url to services table

  1. Changes
    - Add `image_url` column to `services` table to support displaying images for car rentals, attractions, and other services
  
  2. Details
    - Column is optional (nullable) to maintain backward compatibility
    - Allows storing URLs for service images from Pexels or other sources
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE services ADD COLUMN image_url text;
  END IF;
END $$;