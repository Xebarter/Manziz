/*
  # Storage Policy for Menu Images

  1. Storage Policies
    - Allow anonymous users to upload images to menu-images bucket
    - Allow anonymous users to read images from menu-images bucket
    - Allow anonymous users to delete images from menu-images bucket

  2. Security Notes
    - This allows anonymous uploads which is suitable for admin functionality
    - In production, consider implementing proper admin authentication
    - File size and type validation is handled in the application layer
*/

-- Create policy to allow anonymous users to insert (upload) files
CREATE POLICY "Allow anonymous uploads to menu-images"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'menu-images');

-- Create policy to allow anonymous users to select (read) files
CREATE POLICY "Allow anonymous reads from menu-images"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'menu-images');

-- Create policy to allow anonymous users to delete files
CREATE POLICY "Allow anonymous deletes from menu-images"
  ON storage.objects
  FOR DELETE
  TO anon
  USING (bucket_id = 'menu-images');

-- Ensure the menu-images bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;