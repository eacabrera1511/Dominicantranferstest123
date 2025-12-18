/*
  # Add device_id to conversations table

  1. Changes
    - Add `device_id` column to `conversations` table to enable device-specific chat history
    - Each device will have its own unique ID stored in localStorage
    - Users on different devices will see separate chat histories

  2. Security
    - Column is nullable to preserve existing data
    - Indexed for faster queries
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'device_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN device_id text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_conversations_device_id ON conversations(device_id);
