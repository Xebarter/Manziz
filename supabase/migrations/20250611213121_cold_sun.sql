/*
  # Fix Admin Authentication Integration

  1. Changes
    - Update RLS policies to work with Supabase auth
    - Create function to check if authenticated user is admin
    - Update admin-related policies to use proper auth integration

  2. Security
    - Maintain RLS on all tables
    - Ensure only authenticated admins can manage menu items
    - Keep existing user policies intact
*/

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current authenticated user exists in admins table
  -- This assumes admin records will have auth.uid() as their id
  RETURN EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid()
  );
END;
$$;

-- Update menu_items policies to use the new function
DROP POLICY IF EXISTS "Admins can insert menu items" ON menu_items;
DROP POLICY IF EXISTS "Admins can update menu items" ON menu_items;
DROP POLICY IF EXISTS "Admins can delete menu items" ON menu_items;

CREATE POLICY "Admins can insert menu items"
  ON menu_items
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update menu items"
  ON menu_items
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete menu items"
  ON menu_items
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Update orders policies
DROP POLICY IF EXISTS "Admins can read all orders" ON orders;
CREATE POLICY "Admins can read all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Update order_items policies  
DROP POLICY IF EXISTS "Admins can read all order_items" ON order_items;
CREATE POLICY "Admins can read all order_items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Update reservations policies
DROP POLICY IF EXISTS "Admins can read all reservations" ON reservations;
CREATE POLICY "Admins can read all reservations"
  ON reservations
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Update admins policies
DROP POLICY IF EXISTS "Admins can read own data" ON admins;
CREATE POLICY "Admins can read own data"
  ON admins
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allow admins to insert their own record (for registration)
CREATE POLICY "Admins can insert own data"
  ON admins
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());