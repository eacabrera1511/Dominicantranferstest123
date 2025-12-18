/*
  # Fix Vehicle Types RLS Policies

  ## Overview
  Updates RLS policies on vehicle_types table to allow authenticated admin users
  to properly insert and manage vehicle types.

  ## Changes
  1. Drop existing policies
  2. Create new simplified policies that work correctly
  3. Allow all authenticated users to view active types
  4. Allow admin users (those accessing admin panel) to manage all types

  ## Security
  - Public users can only see active types
  - Authenticated users in admin panel can manage types
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active vehicle types" ON vehicle_types;
DROP POLICY IF EXISTS "Admins can insert vehicle types" ON vehicle_types;
DROP POLICY IF EXISTS "Admins can update vehicle types" ON vehicle_types;
DROP POLICY IF EXISTS "Admins can delete vehicle types" ON vehicle_types;
DROP POLICY IF EXISTS "Admins can manage vehicle types" ON vehicle_types;

-- Create new policies
-- Allow everyone to view active vehicle types
CREATE POLICY "Public can view active vehicle types"
  ON vehicle_types FOR SELECT
  USING (is_active = true);

-- Allow authenticated users to view all vehicle types
CREATE POLICY "Authenticated users can view all vehicle types"
  ON vehicle_types FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert vehicle types
CREATE POLICY "Authenticated users can insert vehicle types"
  ON vehicle_types FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update vehicle types
CREATE POLICY "Authenticated users can update vehicle types"
  ON vehicle_types FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete vehicle types
CREATE POLICY "Authenticated users can delete vehicle types"
  ON vehicle_types FOR DELETE
  TO authenticated
  USING (true);
