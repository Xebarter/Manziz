/*
  # Create storage bucket for menu images

  1. Storage Setup
    - Create 'menu-images' bucket for storing menu item images
    - Set up public access for the bucket
    - Configure RLS policies for the bucket

  2. Security
    - Allow public read access to images
    - Allow authenticated users (admins) to upload/delete images
*/

-- Create the storage bucket for menu images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Allow public read access to menu images
CREATE POLICY "Public read access for menu images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'menu-images');

-- Allow authenticated users to upload menu images
CREATE POLICY "Authenticated users can upload menu images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'menu-images');

-- Allow authenticated users to update menu images
CREATE POLICY "Authenticated users can update menu images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'menu-images');

-- Allow authenticated users to delete menu images
CREATE POLICY "Authenticated users can delete menu images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'menu-images');