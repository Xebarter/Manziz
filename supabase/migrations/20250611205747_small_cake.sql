/*
  # Add admin policies for dashboard access

  1. Security Changes
    - Add policy for admins to read all orders
    - Add policy for admins to read all reservations  
    - Add policy for admins to read all order_items
    - Add policy for public to read reservations (for admin dashboard stats)

  2. Notes
    - These policies allow admin users (identified by having a record in the admins table) to access all data
    - Also adds a temporary policy for anonymous access to reservations for dashboard stats
*/

-- Policy to allow admins to read all orders
CREATE POLICY "Admins can read all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    )
  );

-- Policy to allow admins to read all reservations
CREATE POLICY "Admins can read all reservations"
  ON reservations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    )
  );

-- Policy to allow public to read reservations (for stats)
CREATE POLICY "Anyone can read reservations"
  ON reservations
  FOR SELECT
  TO public
  USING (true);

-- Policy to allow admins to read all order_items
CREATE POLICY "Admins can read all order_items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    )
  );