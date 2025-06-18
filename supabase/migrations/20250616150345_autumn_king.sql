/*
  # Fix storage setup and add popular menu items

  1. Storage Configuration
    - Create images bucket with proper settings
    - Set up public access policies for image operations
    
  2. Menu Items Policies
    - Update RLS policies to allow public operations
    - Enable proper CRUD operations for menu management
    
  3. Sample Data
    - Add sample menu items with popular tags
    - Use proper conflict handling for existing data
*/

-- Create storage bucket for images if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'images', 
    'images', 
    true, 
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  );
EXCEPTION WHEN unique_violation THEN
  -- Update existing bucket settings
  UPDATE storage.buckets 
  SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  WHERE id = 'images';
END $$;

-- Drop existing storage policies to recreate them
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload to images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Public can update images" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete images" ON storage.objects;

-- Create comprehensive storage policies for images bucket
CREATE POLICY "Public can upload to images bucket"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "Public can view images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'images');

CREATE POLICY "Public can update images"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'images')
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "Public can delete images"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'images');

-- Ensure menu_items policies are properly set
DROP POLICY IF EXISTS "Anyone can insert menu items" ON menu_items;
DROP POLICY IF EXISTS "Anyone can update menu items" ON menu_items;
DROP POLICY IF EXISTS "Anyone can delete menu items" ON menu_items;

CREATE POLICY "Public can insert menu items"
  ON menu_items
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update menu items"
  ON menu_items
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete menu items"
  ON menu_items
  FOR DELETE
  TO public
  USING (true);

-- Add sample menu items with popular tags if they don't exist
-- Check and insert each item individually to avoid conflicts
DO $$
BEGIN
  -- Manziz Special Burger
  IF NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Manziz Special Burger') THEN
    INSERT INTO menu_items (name, description, category, price, is_available, tags, image_url)
    VALUES (
      'Manziz Special Burger',
      'Our signature burger with premium beef, fresh vegetables, and special sauce',
      'burgers',
      25000,
      true,
      ARRAY['popular', 'signature'],
      'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=500'
    );
  END IF;

  -- Chicken Rolex
  IF NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Chicken Rolex') THEN
    INSERT INTO menu_items (name, description, category, price, is_available, tags, image_url)
    VALUES (
      'Chicken Rolex',
      'Traditional Ugandan wrap with grilled chicken, vegetables, and spices',
      'chicken',
      15000,
      true,
      ARRAY['popular', 'local'],
      'https://images.pexels.com/photos/2474658/pexels-photo-2474658.jpeg?auto=compress&cs=tinysrgb&w=500'
    );
  END IF;

  -- Manziz Crispy Fries
  IF NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Manziz Crispy Fries') THEN
    INSERT INTO menu_items (name, description, category, price, is_available, tags, image_url)
    VALUES (
      'Manziz Crispy Fries',
      'Golden crispy fries seasoned with our special blend of spices',
      'sides',
      12000,
      true,
      ARRAY['popular', 'crispy'],
      'https://images.pexels.com/photos/1893556/pexels-photo-1893556.jpeg?auto=compress&cs=tinysrgb&w=500'
    );
  END IF;

  -- Grilled Chicken Wings
  IF NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Grilled Chicken Wings') THEN
    INSERT INTO menu_items (name, description, category, price, is_available, tags, image_url)
    VALUES (
      'Grilled Chicken Wings',
      'Juicy chicken wings grilled to perfection with our signature marinade',
      'chicken',
      18000,
      true,
      ARRAY['grilled', 'spicy'],
      'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=500'
    );
  END IF;

  -- Fresh Fruit Juice
  IF NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Fresh Fruit Juice') THEN
    INSERT INTO menu_items (name, description, category, price, is_available, tags, image_url)
    VALUES (
      'Fresh Fruit Juice',
      'Refreshing blend of seasonal fruits, freshly squeezed',
      'drinks',
      8000,
      true,
      ARRAY['fresh', 'healthy'],
      'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=500'
    );
  END IF;
END $$;