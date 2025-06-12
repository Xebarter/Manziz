/*
  # Add is_favorite field to menu_items table

  1. Changes
    - Add `is_favorite` boolean field to menu_items table
    - Set default value to false
    - Add index for better query performance

  2. Security
    - Only admins can update the is_favorite field
    - Public can read the field to display favorites
*/

-- Add is_favorite column to menu_items table
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;

-- Create index for better performance when querying favorites
CREATE INDEX IF NOT EXISTS idx_menu_items_is_favorite ON menu_items(is_favorite);

-- Update the existing policy to ensure admins can update the is_favorite field
-- (This is already covered by existing admin policies, but adding for clarity)