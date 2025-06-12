/*
  # Setup Supabase Storage for menu images

  1. Storage Setup
    - Create `menu-images` bucket for storing menu item images
    - Set bucket to public for image access

  2. Security Policies
    - Allow authenticated users to upload, update, and delete images
    - Allow public read access to view images on the website
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update menu images" ON storage.objects;

-- Policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload menu images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-images');

-- Policy to allow public read access to menu images
CREATE POLICY "Public can view menu images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'menu-images');

-- Policy to allow authenticated users to delete menu images
CREATE POLICY "Authenticated users can delete menu images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'menu-images');

-- Policy to allow authenticated users to update menu images
CREATE POLICY "Authenticated users can update menu images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'menu-images')
WITH CHECK (bucket_id = 'menu-images');