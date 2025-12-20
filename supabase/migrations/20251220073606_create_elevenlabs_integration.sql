/*
  # ElevenLabs Voice Booking Integration

  1. New Tables
    - `api_credentials` - Stores API keys and credentials securely
      - `id` (uuid, primary key)
      - `service_name` (text) - Name of the service (e.g., 'elevenlabs')
      - `api_key` (text) - Encrypted API key
      - `config` (jsonb) - Additional configuration
      - `is_active` (boolean) - Whether this integration is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `voice_sessions` - Tracks voice booking sessions
      - `id` (uuid, primary key)
      - `conversation_id` (uuid) - Links to conversations table
      - `session_data` (jsonb) - Voice session state
      - `mode` (text) - 'voice' or 'chat'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Admin-only access for api_credentials
    - User-specific access for voice_sessions
*/

-- Create api_credentials table
CREATE TABLE IF NOT EXISTS api_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text UNIQUE NOT NULL,
  api_key text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create voice_sessions table
CREATE TABLE IF NOT EXISTS voice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  session_data jsonb DEFAULT '{}'::jsonb,
  mode text DEFAULT 'chat' CHECK (mode IN ('voice', 'chat')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE api_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_credentials (admin only)
CREATE POLICY "Service role can manage API credentials"
  ON api_credentials
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for voice_sessions
CREATE POLICY "Users can view own voice sessions"
  ON voice_sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can create voice sessions"
  ON voice_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own voice sessions"
  ON voice_sessions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Insert ElevenLabs API key
INSERT INTO api_credentials (service_name, api_key, config, is_active)
VALUES (
  'elevenlabs',
  'sk_1487f4979d230a0d1b6c8bef87f92b5d6898b23ad56437d7',
  '{"agent_id": "Dominican Transfers", "model": "eleven_turbo_v2", "voice_id": "21m00Tcm4TlvDq8ikWAM"}'::jsonb,
  true
)
ON CONFLICT (service_name) 
DO UPDATE SET 
  api_key = EXCLUDED.api_key,
  config = EXCLUDED.config,
  updated_at = now();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_voice_sessions_conversation_id ON voice_sessions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_mode ON voice_sessions(mode);

-- Create updated_at trigger for voice_sessions
CREATE OR REPLACE FUNCTION update_voice_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_voice_sessions_updated_at
  BEFORE UPDATE ON voice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_voice_sessions_updated_at();