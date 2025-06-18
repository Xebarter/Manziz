/*
  # Fix Database Synchronization Issues

  1. Add missing RLS policies for UPDATE and DELETE operations
  2. Enable real-time for all tables
  3. Add proper policies for admin operations
*/

-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;

-- Add missing RLS policies for orders table
DROP POLICY IF EXISTS "Anyone can update orders" ON orders;
DROP POLICY IF EXISTS "Anyone can delete orders" ON orders;

CREATE POLICY "Anyone can update orders"
  ON orders
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete orders"
  ON orders
  FOR DELETE
  TO public
  USING (true);

-- Add missing RLS policies for order_items table
DROP POLICY IF EXISTS "Anyone can update order items" ON order_items;
DROP POLICY IF EXISTS "Anyone can delete order items" ON order_items;

CREATE POLICY "Anyone can update order items"
  ON order_items
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete order items"
  ON order_items
  FOR DELETE
  TO public
  USING (true);

-- Add missing RLS policies for conversations table
DROP POLICY IF EXISTS "Anyone can update conversations" ON conversations;
DROP POLICY IF EXISTS "Anyone can delete conversations" ON conversations;

CREATE POLICY "Anyone can update conversations"
  ON conversations
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete conversations"
  ON conversations
  FOR DELETE
  TO public
  USING (true);

-- Add missing RLS policies for messages table
DROP POLICY IF EXISTS "Anyone can update messages" ON messages;
DROP POLICY IF EXISTS "Anyone can delete messages" ON messages;

CREATE POLICY "Anyone can update messages"
  ON messages
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete messages"
  ON messages
  FOR DELETE
  TO public
  USING (true);

-- Add missing RLS policies for reservations table
DROP POLICY IF EXISTS "Anyone can update reservations" ON reservations;
DROP POLICY IF EXISTS "Anyone can delete reservations" ON reservations;

CREATE POLICY "Anyone can update reservations"
  ON reservations
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete reservations"
  ON reservations
  FOR DELETE
  TO public
  USING (true);

-- Ensure all tables have RLS enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Add triggers to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at column to tables that don't have it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE order_items ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE messages ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_menu_items_updated_at_trigger ON menu_items;
CREATE TRIGGER update_menu_items_updated_at_trigger
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_order_items_updated_at_trigger ON order_items;
CREATE TRIGGER update_order_items_updated_at_trigger
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_messages_updated_at_trigger ON messages;
CREATE TRIGGER update_messages_updated_at_trigger
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at(); 