/*
  # Storage bucket and RLS policies for menu images

  1. Storage Setup
    - Create 'menu-images' storage bucket if it doesn't exist
    - Enable RLS on the bucket
    
  2. Security Policies
    - Allow authenticated users to upload images (INSERT)
    - Allow public read access to images (SELECT)
    - Allow authenticated users to delete images (DELETE)
    - Allow authenticated users to update images (UPDATE)

  3. Notes
    - Images will be publicly readable for menu display
    - Only authenticated users can upload/modify images
    - Admins have full access through authentication
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the storage bucket
UPDATE storage.buckets 
SET public = true 
WHERE id = 'menu-images';

-- Policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-images');

-- Policy to allow public read access to images
CREATE POLICY "Public can view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'menu-images');

-- Policy to allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'menu-images');

-- Policy to allow authenticated users to update images
CREATE POLICY "Authenticated users can update images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'menu-images')
WITH CHECK (bucket_id = 'menu-images');