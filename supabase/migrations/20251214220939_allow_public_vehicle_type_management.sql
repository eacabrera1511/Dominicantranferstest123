/*
  # Allow Public Vehicle Type Management (Temporary)

  ## Overview
  Temporarily allows public access to vehicle type management for development.
  This should be restricted in production with proper authentication.

  ## Changes
  1. Update policies to allow public access to vehicle types
  2. Remove authentication requirement temporarily

  ## Security Note
  This is a temporary measure for development. In production, proper admin
  authentication should be implemented.
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view active vehicle types" ON vehicle_types;
DROP POLICY IF EXISTS "Authenticated users can view all vehicle types" ON vehicle_types;
DROP POLICY IF EXISTS "Authenticated users can insert vehicle types" ON vehicle_types;
DROP POLICY IF EXISTS "Authenticated users can update vehicle types" ON vehicle_types;
DROP POLICY IF EXISTS "Authenticated users can delete vehicle types" ON vehicle_types;

-- Create permissive policies for development
CREATE POLICY "Allow all to view vehicle types"
  ON vehicle_types FOR SELECT
  USING (true);

CREATE POLICY "Allow all to insert vehicle types"
  ON vehicle_types FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all to update vehicle types"
  ON vehicle_types FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all to delete vehicle types"
  ON vehicle_types FOR DELETE
  USING (true);
