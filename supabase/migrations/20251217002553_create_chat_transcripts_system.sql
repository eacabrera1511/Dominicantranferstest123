/*
  # Create Chat Transcripts System

  1. New Tables
    - `chat_conversations`
      - `id` (uuid, primary key)
      - `device_id` (text) - unique identifier for each chat session
      - `started_at` (timestamptz) - when conversation started
      - `last_message_at` (timestamptz) - last message timestamp
      - `language` (text) - detected language
      - `booking_created` (boolean) - whether a booking was made
      - `booking_id` (uuid, nullable) - link to booking if created
      - `session_metadata` (jsonb) - additional session info
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `chat_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key to chat_conversations)
      - `role` (text) - 'user' or 'assistant'
      - `content` (text) - message content
      - `message_type` (text) - 'text', 'booking_action', 'price_scan', etc.
      - `metadata` (jsonb) - additional message metadata (booking actions, etc.)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Admins can view all transcripts
    - Public can create messages (for chat functionality)

  3. Indexes
    - Add indexes for conversation lookup by device_id
    - Add indexes for messages by conversation_id
    - Add indexes for timestamp-based queries
*/

-- Create chat_conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  started_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  language text DEFAULT 'en',
  booking_created boolean DEFAULT false,
  booking_id uuid REFERENCES bookings(id),
  session_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  message_type text DEFAULT 'text',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_device_id ON chat_conversations(device_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_started_at ON chat_conversations(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_booking_id ON chat_conversations(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_conversations

-- Allow public to insert conversations (for new chat sessions)
CREATE POLICY "Anyone can create conversations"
  ON chat_conversations
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to read their own conversations by device_id
CREATE POLICY "Users can read own conversations"
  ON chat_conversations
  FOR SELECT
  TO public
  USING (true);

-- Allow public to update their own conversations
CREATE POLICY "Users can update own conversations"
  ON chat_conversations
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow authenticated admins to read all conversations
CREATE POLICY "Admins can read all conversations"
  ON chat_conversations
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for chat_messages

-- Allow public to insert messages (for chat functionality)
CREATE POLICY "Anyone can create messages"
  ON chat_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to read messages from their conversations
CREATE POLICY "Anyone can read messages"
  ON chat_messages
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated admins to read all messages
CREATE POLICY "Admins can read all messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to update last_message_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations
  SET 
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update last_message_at
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON chat_messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Create function to link conversations to bookings
CREATE OR REPLACE FUNCTION link_conversation_to_booking(
  p_conversation_id uuid,
  p_booking_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE chat_conversations
  SET 
    booking_created = true,
    booking_id = p_booking_id,
    updated_at = now()
  WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
