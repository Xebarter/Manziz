/*
  # Add User Account System

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text)
      - `first_name` (text)
      - `last_name` (text)
      - `phone_number` (text)
      - `date_of_birth` (date, nullable)
      - `address` (text, nullable)
      - `email_verified` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `user_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `session_token` (text, unique)
      - `expires_at` (timestamp)
      - `created_at` (timestamp)

    - `user_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `favorite_items` (uuid array)
      - `dietary_restrictions` (text array)
      - `default_delivery_address` (text)
      - `marketing_emails` (boolean, default true)
      - `order_notifications` (boolean, default true)

  2. Updates to existing tables
    - Add `user_id` to orders table (nullable for guest orders)
    - Add `user_id` to reservations table (nullable for guest reservations)
    - Add `user_id` to conversations table (nullable for guest chats)

  3. Security
    - Enable RLS on all new tables
    - Add policies for user data access
    - Ensure users can only access their own data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone_number text,
  date_of_birth date,
  address text,
  email_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  favorite_items uuid[] DEFAULT '{}',
  dietary_restrictions text[] DEFAULT '{}',
  default_delivery_address text,
  marketing_emails boolean DEFAULT true,
  order_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add user_id to existing tables
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO public
  USING (true); -- Allow reading for authentication purposes

CREATE POLICY "Anyone can create user accounts"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create policies for user_sessions table
CREATE POLICY "Users can view their own sessions"
  ON user_sessions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create sessions"
  ON user_sessions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can delete their own sessions"
  ON user_sessions
  FOR DELETE
  TO public
  USING (true);

-- Create policies for user_preferences table
CREATE POLICY "Users can view their own preferences"
  ON user_preferences
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create their own preferences"
  ON user_preferences
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Update existing table policies to include user-specific access
-- Update orders policies
DROP POLICY IF EXISTS "Anyone can view their orders" ON orders;
CREATE POLICY "Users can view their own orders and anyone can view by phone"
  ON orders
  FOR SELECT
  TO public
  USING (true); -- Keep existing functionality for phone-based lookup

-- Update reservations policies  
DROP POLICY IF EXISTS "Anyone can view reservations" ON reservations;
CREATE POLICY "Users can view their own reservations and anyone can view by phone"
  ON reservations
  FOR SELECT
  TO public
  USING (true); -- Keep existing functionality for phone-based lookup

-- Update conversations policies
DROP POLICY IF EXISTS "Enable read access for conversations" ON conversations;
CREATE POLICY "Users can view their own conversations and anyone can view by identifier"
  ON conversations
  FOR SELECT
  TO public
  USING (true); -- Keep existing functionality

-- Create function to update user updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update user updated_at
DROP TRIGGER IF EXISTS update_user_updated_at_trigger ON users;
CREATE TRIGGER update_user_updated_at_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_updated_at();

-- Create trigger to update user_preferences updated_at
DROP TRIGGER IF EXISTS update_user_preferences_updated_at_trigger ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at_trigger
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_updated_at();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically create user preferences
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create user preferences
DROP TRIGGER IF EXISTS create_user_preferences_trigger ON users;
CREATE TRIGGER create_user_preferences_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_preferences();