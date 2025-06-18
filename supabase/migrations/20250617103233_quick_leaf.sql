/*
  # Add updated_at column to orders table

  1. Changes
    - Add `updated_at` column to `orders` table with default value of now()
    - Add trigger to automatically update `updated_at` when order is modified
  
  2. Security
    - No changes to RLS policies needed
*/

-- Add updated_at column to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at column
DROP TRIGGER IF EXISTS update_orders_updated_at_trigger ON orders;
CREATE TRIGGER update_orders_updated_at_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();