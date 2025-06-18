/*
  # Add conversation status tracking

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `customer_identifier` (text) - phone/email or generated ID
      - `status` (text) - 'new', 'pending', 'resolved'
      - `last_message_at` (timestamp)
      - `assigned_admin` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes to messages table
    - Add `conversation_id` (uuid, foreign key)
    - Add index for better performance

  3. Security
    - Enable RLS on conversations table
    - Add policies for public access (matching current setup)
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_identifier text NOT NULL,
  status text DEFAULT 'new' CHECK (status IN ('new', 'pending', 'resolved')),
  last_message_at timestamptz DEFAULT now(),
  assigned_admin text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add conversation_id to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at);
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_identifier);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- Enable RLS on conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations
CREATE POLICY "Enable read access for conversations" ON conversations
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for conversations" ON conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for conversations" ON conversations
  FOR UPDATE USING (true) WITH CHECK (true);

-- Create function to update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET 
    last_message_at = NEW.created_at,
    updated_at = now(),
    status = CASE 
      WHEN NEW.sender = 'customer' AND conversations.status = 'resolved' THEN 'new'
      WHEN NEW.sender = 'customer' AND conversations.status != 'resolved' THEN 'pending'
      ELSE conversations.status
    END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update conversation on new message
DROP TRIGGER IF EXISTS update_conversation_on_message ON messages;
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Create function to auto-create conversations
CREATE OR REPLACE FUNCTION create_conversation_if_needed()
RETURNS TRIGGER AS $$
DECLARE
  conv_id uuid;
  customer_id text;
BEGIN
  -- Generate customer identifier (could be enhanced to use actual customer data)
  customer_id := COALESCE(NEW.sender, 'anonymous_' || extract(epoch from now())::text);
  
  -- Only create conversation for customer messages if conversation_id is null
  IF NEW.sender = 'customer' AND NEW.conversation_id IS NULL THEN
    -- Try to find existing conversation for this customer
    SELECT id INTO conv_id 
    FROM conversations 
    WHERE customer_identifier = customer_id 
    ORDER BY last_message_at DESC 
    LIMIT 1;
    
    -- If no conversation exists, create one
    IF conv_id IS NULL THEN
      INSERT INTO conversations (customer_identifier, status, last_message_at)
      VALUES (customer_id, 'new', NEW.created_at)
      RETURNING id INTO conv_id;
    END IF;
    
    -- Update the message with conversation_id
    NEW.conversation_id := conv_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create conversations
DROP TRIGGER IF EXISTS auto_create_conversation ON messages;
CREATE TRIGGER auto_create_conversation
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_conversation_if_needed();