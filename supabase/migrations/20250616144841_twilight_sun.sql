/*
  # Add admin policies for menu management

  1. Security Updates
    - Add INSERT policy for menu_items table to allow creating new items
    - Add UPDATE policy for menu_items table to allow editing existing items
    - Add storage policies for image uploads to the images bucket

  2. Changes
    - Enable public INSERT operations on menu_items (for admin functionality)
    - Enable public UPDATE operations on menu_items (for admin functionality)
    - Add storage bucket policies for image uploads
    - Maintain existing SELECT policies

  Note: These policies allow public access for simplicity. In production, 
  you should implement proper admin authentication and restrict these 
  policies to authenticated admin users only.
*/

-- Add INSERT policy for menu_items
CREATE POLICY "Anyone can insert menu items"
  ON menu_items
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Add UPDATE policy for menu_items
CREATE POLICY "Anyone can update menu items"
  ON menu_items
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Add DELETE policy for menu_items (for completeness)
CREATE POLICY "Anyone can delete menu items"
  ON menu_items
  FOR DELETE
  TO public
  USING (true);

-- Storage policies for images bucket
-- Note: These will only work if the 'images' bucket exists
-- Create the bucket first in Supabase dashboard if it doesn't exist

-- Allow anyone to upload images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow uploads to images bucket
CREATE POLICY "Anyone can upload images"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'images');

-- Policy to allow viewing images
CREATE POLICY "Anyone can view images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'images');

-- Policy to allow updating images
CREATE POLICY "Anyone can update images"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'images')
  WITH CHECK (bucket_id = 'images');

-- Policy to allow deleting images
CREATE POLICY "Anyone can delete images"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'images');