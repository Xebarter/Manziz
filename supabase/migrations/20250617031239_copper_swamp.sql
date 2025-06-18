/*
  # Fix RLS policies for messages table

  1. Security Updates
    - Update RLS policies on `messages` table to allow proper access
    - Allow anonymous users to read and insert messages for chat functionality
    - Ensure both admin and customer interfaces can access messages

  2. Changes
    - Drop existing restrictive policies
    - Create new policies that allow anonymous access for chat functionality
    - Maintain security while enabling proper chat operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can create messages" ON messages;
DROP POLICY IF EXISTS "Anyone can view messages" ON messages;

-- Create new policies that allow proper access
CREATE POLICY "Enable read access for all users" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON messages
  FOR INSERT WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;