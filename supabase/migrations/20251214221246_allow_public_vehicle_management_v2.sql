/*
  # Allow Public Vehicle Management (Temporary)

  ## Overview
  Temporarily allows public access to vehicle management for development.
  This should be restricted in production with proper authentication.

  ## Changes
  1. Add policies to allow public access to vehicles table
  2. Keep existing role-based policies for when authentication is implemented

  ## Security Note
  This is a temporary measure for development. In production, proper admin
  authentication should be implemented and these public policies should be removed.
*/

-- Drop if exists and create new policies for development
DO $$ 
BEGIN
  -- Drop policies if they exist
  DROP POLICY IF EXISTS "Allow all to view vehicles" ON vehicles;
  DROP POLICY IF EXISTS "Allow all to insert vehicles" ON vehicles;
  DROP POLICY IF EXISTS "Allow all to update vehicles" ON vehicles;
  DROP POLICY IF EXISTS "Allow all to delete vehicles" ON vehicles;
END $$;

-- Create permissive policies for development
CREATE POLICY "Allow all to view vehicles"
  ON vehicles FOR SELECT
  USING (true);

CREATE POLICY "Allow all to insert vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all to update vehicles"
  ON vehicles FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all to delete vehicles"
  ON vehicles FOR DELETE
  USING (true);
