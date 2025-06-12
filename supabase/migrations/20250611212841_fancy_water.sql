/*
  # Add Admin Policies for Menu Items

  1. Security Changes
    - Add INSERT policy for admins to create menu items
    - Add UPDATE policy for admins to modify menu items  
    - Add DELETE policy for admins to remove menu items
    
  2. Policy Details
    - Only authenticated users who exist in the admins table can perform these operations
    - Uses EXISTS clause to check if the authenticated user's ID exists in the admins table
    - Maintains existing public SELECT policy for menu browsing
*/

-- Add INSERT policy for admins
CREATE POLICY "Admins can insert menu items"
  ON menu_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    )
  );

-- Add UPDATE policy for admins  
CREATE POLICY "Admins can update menu items"
  ON menu_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    )
  );

-- Add DELETE policy for admins
CREATE POLICY "Admins can delete menu items"
  ON menu_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    )
  );