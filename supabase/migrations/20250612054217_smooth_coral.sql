/*
  # Update messages table for enhanced functionality

  1. Schema Changes
    - Add customer contact information fields
    - Add is_read status tracking
    - Add reply_to field for message threading
    - Update RLS policies for better security

  2. New Columns
    - `customer_name` (text) - Customer's name
    - `customer_email` (text) - Customer's email
    - `customer_phone` (text) - Customer's phone number
    - `is_read` (boolean) - Message read status
    - `reply_to` (uuid) - Reference to parent message for threading

  3. Security
    - Update RLS policies for new fields
    - Maintain existing access patterns
*/

-- Add new columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS customer_email text,
ADD COLUMN IF NOT EXISTS customer_phone text,
ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reply_to uuid REFERENCES messages(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Update RLS policies to handle new fields
DROP POLICY IF EXISTS "Anyone can create messages" ON messages;
DROP POLICY IF EXISTS "Anyone can read messages" ON messages;

-- Allow anyone to create messages (for customer support)
CREATE POLICY "Anyone can create messages"
  ON messages
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow anyone to read messages (for customer support)
CREATE POLICY "Anyone can read messages"
  ON messages
  FOR SELECT
  TO public
  USING (true);

-- Allow admins to update messages (mark as read, etc.)
CREATE POLICY "Admins can update messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Allow admins to delete messages if needed
CREATE POLICY "Admins can delete messages"
  ON messages
  FOR DELETE
  TO authenticated
  USING (is_admin());