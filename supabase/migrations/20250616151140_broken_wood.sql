/*
  # Setup Image Storage Bucket

  1. Storage Setup
    - Create 'images' storage bucket for menu item photos
    - Configure bucket to be public for easy access
    - Set up proper folder structure

  2. Security Policies
    - Allow anonymous users to upload images (INSERT policy)
    - Allow public access to view images (SELECT policy)
    - Restrict uploads to image files only
    - Set reasonable file size limits

  3. Notes
    - This enables image upload functionality for the menu management system
    - Anonymous access is configured since the admin system doesn't use Supabase auth
    - Policies are designed for demo/development use
*/

-- Create the images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Policy to allow anonymous users to upload images
CREATE POLICY "Allow anonymous image uploads"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'images');

-- Policy to allow public access to view images
CREATE POLICY "Allow public image access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'images');

-- Policy to allow anonymous users to update images (for overwriting)
CREATE POLICY "Allow anonymous image updates"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

-- Policy to allow anonymous users to delete images
CREATE POLICY "Allow anonymous image deletion"
ON storage.objects
FOR DELETE
USING (bucket_id = 'images');