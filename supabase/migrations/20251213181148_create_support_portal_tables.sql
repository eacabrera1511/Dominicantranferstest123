/*
  # Internal Support Portal Tables

  1. New Tables
    - `support_agents`
      - `id` (uuid, primary key)
      - `email` (text, unique) - Agent email
      - `name` (text) - Agent full name
      - `role` (text) - agent, senior_agent, supervisor, manager
      - `department` (text) - customer_support, partner_support, technical
      - `status` (text) - active, away, offline
      - `avatar_url` (text) - Profile image URL
      - `created_at` (timestamptz)
      - `last_active` (timestamptz)

    - `support_tickets`
      - `id` (uuid, primary key)
      - `ticket_number` (text, unique) - Human-readable ticket ID
      - `subject` (text) - Ticket subject
      - `description` (text) - Full description
      - `status` (text) - open, in_progress, pending, resolved, closed
      - `priority` (text) - low, medium, high, urgent
      - `category` (text) - booking, payment, technical, complaint, inquiry, partner
      - `source` (text) - chat, email, phone, web_form
      - `customer_name` (text) - Customer's name
      - `customer_email` (text) - Customer's email
      - `customer_phone` (text) - Customer's phone
      - `partner_id` (uuid) - Reference to partner if partner ticket
      - `assigned_to` (uuid) - Assigned agent
      - `created_by` (uuid) - Agent who created the ticket
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `resolved_at` (timestamptz)
      - `first_response_at` (timestamptz)

    - `ticket_communications`
      - `id` (uuid, primary key)
      - `ticket_id` (uuid) - Reference to ticket
      - `agent_id` (uuid) - Agent who logged the communication
      - `type` (text) - note, email_in, email_out, call_in, call_out, chat
      - `content` (text) - Communication content/transcript
      - `is_internal` (boolean) - Internal note vs customer-facing
      - `attachments` (jsonb) - Array of attachment URLs
      - `created_at` (timestamptz)

    - `ticket_follow_ups`
      - `id` (uuid, primary key)
      - `ticket_id` (uuid) - Reference to ticket
      - `agent_id` (uuid) - Assigned agent for follow-up
      - `due_date` (timestamptz) - When follow-up is due
      - `reminder_date` (timestamptz) - When to send reminder
      - `note` (text) - Follow-up notes
      - `status` (text) - pending, completed, overdue, cancelled
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)

    - `ticket_tags`
      - `id` (uuid, primary key)
      - `ticket_id` (uuid) - Reference to ticket
      - `tag` (text) - Tag name
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public access for demo purposes

  3. Seed Data
    - Insert sample agents and tickets
*/

-- Support Agents Table
CREATE TABLE IF NOT EXISTS support_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'agent',
  department text NOT NULL DEFAULT 'customer_support',
  status text NOT NULL DEFAULT 'offline',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  last_active timestamptz
);

ALTER TABLE support_agents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_agents' AND policyname = 'Public access for support agents') THEN
    CREATE POLICY "Public access for support agents" ON support_agents FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  subject text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  category text NOT NULL DEFAULT 'inquiry',
  source text NOT NULL DEFAULT 'web_form',
  customer_name text,
  customer_email text,
  customer_phone text,
  partner_id uuid REFERENCES partners(id),
  assigned_to uuid REFERENCES support_agents(id),
  created_by uuid REFERENCES support_agents(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  first_response_at timestamptz
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_tickets' AND policyname = 'Public access for support tickets') THEN
    CREATE POLICY "Public access for support tickets" ON support_tickets FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Ticket Communications Table
CREATE TABLE IF NOT EXISTS ticket_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES support_agents(id),
  type text NOT NULL DEFAULT 'note',
  content text NOT NULL,
  is_internal boolean DEFAULT false,
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_communications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ticket_communications' AND policyname = 'Public access for ticket communications') THEN
    CREATE POLICY "Public access for ticket communications" ON ticket_communications FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Ticket Follow-ups Table
CREATE TABLE IF NOT EXISTS ticket_follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES support_agents(id),
  due_date timestamptz NOT NULL,
  reminder_date timestamptz,
  note text,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_follow_ups ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ticket_follow_ups' AND policyname = 'Public access for ticket follow ups') THEN
    CREATE POLICY "Public access for ticket follow ups" ON ticket_follow_ups FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Ticket Tags Table
CREATE TABLE IF NOT EXISTS ticket_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(ticket_id, tag)
);

ALTER TABLE ticket_tags ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ticket_tags' AND policyname = 'Public access for ticket tags') THEN
    CREATE POLICY "Public access for ticket tags" ON ticket_tags FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_number ON support_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_ticket_communications_ticket ON ticket_communications(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_follow_ups_ticket ON ticket_follow_ups(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_follow_ups_due ON ticket_follow_ups(due_date);
CREATE INDEX IF NOT EXISTS idx_ticket_tags_ticket ON ticket_tags(ticket_id);

-- Insert sample support agents
INSERT INTO support_agents (email, name, role, department, status) VALUES
  ('maria.santos@support.com', 'Maria Santos', 'supervisor', 'customer_support', 'active'),
  ('carlos.rodriguez@support.com', 'Carlos Rodriguez', 'senior_agent', 'customer_support', 'active'),
  ('ana.garcia@support.com', 'Ana Garcia', 'agent', 'customer_support', 'active'),
  ('luis.martinez@support.com', 'Luis Martinez', 'agent', 'partner_support', 'away'),
  ('sofia.hernandez@support.com', 'Sofia Hernandez', 'agent', 'technical', 'active')
ON CONFLICT (email) DO NOTHING;

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
DECLARE
  new_number text;
  counter int;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM support_tickets;
  new_number := 'TKT-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || LPAD(counter::text, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Insert sample tickets
DO $$
DECLARE
  agent1_id uuid;
  agent2_id uuid;
  agent3_id uuid;
  ticket1_id uuid;
  ticket2_id uuid;
  ticket3_id uuid;
  ticket4_id uuid;
  ticket5_id uuid;
BEGIN
  SELECT id INTO agent1_id FROM support_agents WHERE email = 'maria.santos@support.com';
  SELECT id INTO agent2_id FROM support_agents WHERE email = 'carlos.rodriguez@support.com';
  SELECT id INTO agent3_id FROM support_agents WHERE email = 'ana.garcia@support.com';

  -- Insert tickets
  INSERT INTO support_tickets (id, ticket_number, subject, description, status, priority, category, source, customer_name, customer_email, customer_phone, assigned_to, created_by, created_at, first_response_at)
  VALUES 
    (gen_random_uuid(), 'TKT-' || TO_CHAR(NOW() - INTERVAL '5 days', 'YYMMDD') || '-0001', 'Booking confirmation not received', 'Customer made a booking 2 days ago but has not received confirmation email. Booking reference: BK-2024-1234', 'in_progress', 'high', 'booking', 'email', 'John Smith', 'john.smith@email.com', '+1-555-0123', agent2_id, agent1_id, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '2 hours')
  RETURNING id INTO ticket1_id;

  INSERT INTO support_tickets (id, ticket_number, subject, description, status, priority, category, source, customer_name, customer_email, customer_phone, assigned_to, created_by, created_at, first_response_at)
  VALUES 
    (gen_random_uuid(), 'TKT-' || TO_CHAR(NOW() - INTERVAL '3 days', 'YYMMDD') || '-0002', 'Refund request for cancelled transfer', 'Customer requesting full refund for cancelled airport transfer due to flight cancellation. Original booking amount: $85', 'pending', 'medium', 'payment', 'phone', 'Sarah Johnson', 'sarah.j@email.com', '+1-555-0456', agent3_id, agent2_id, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '1 hour')
  RETURNING id INTO ticket2_id;

  INSERT INTO support_tickets (id, ticket_number, subject, description, status, priority, category, source, customer_name, customer_email, customer_phone, assigned_to, created_by, created_at)
  VALUES 
    (gen_random_uuid(), 'TKT-' || TO_CHAR(NOW() - INTERVAL '1 day', 'YYMMDD') || '-0003', 'Driver was late for pickup', 'Customer complaint about driver arriving 25 minutes late for airport pickup. Flight was almost missed.', 'open', 'urgent', 'complaint', 'chat', 'Michael Brown', 'mbrown@email.com', '+1-555-0789', NULL, agent1_id, NOW() - INTERVAL '1 day')
  RETURNING id INTO ticket3_id;

  INSERT INTO support_tickets (id, ticket_number, subject, description, status, priority, category, source, customer_name, customer_email, customer_phone, assigned_to, created_by, created_at, resolved_at)
  VALUES 
    (gen_random_uuid(), 'TKT-' || TO_CHAR(NOW() - INTERVAL '7 days', 'YYMMDD') || '-0004', 'How to modify booking date', 'Customer inquiry about changing their transfer date from Dec 20 to Dec 22', 'resolved', 'low', 'inquiry', 'web_form', 'Emily Davis', 'emily.d@email.com', NULL, agent3_id, agent3_id, NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days')
  RETURNING id INTO ticket4_id;

  INSERT INTO support_tickets (id, ticket_number, subject, description, status, priority, category, source, customer_name, customer_email, assigned_to, created_by, created_at, first_response_at)
  VALUES 
    (gen_random_uuid(), 'TKT-' || TO_CHAR(NOW() - INTERVAL '2 days', 'YYMMDD') || '-0005', 'Partner API integration issue', 'Partner reporting 500 errors when trying to sync availability. Need technical investigation.', 'in_progress', 'high', 'partner', 'email', 'Paradise Tours', 'tech@paradisetours.com', agent2_id, agent1_id, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '30 minutes')
  RETURNING id INTO ticket5_id;

  -- Insert communications for tickets
  INSERT INTO ticket_communications (ticket_id, agent_id, type, content, is_internal, created_at) VALUES
    (ticket1_id, agent1_id, 'note', 'Ticket created from customer email. Checking booking system for confirmation status.', true, NOW() - INTERVAL '5 days'),
    (ticket1_id, agent2_id, 'email_out', 'Dear Mr. Smith,\n\nThank you for contacting us. We are looking into your booking confirmation issue and will update you shortly.\n\nBest regards,\nCarlos', false, NOW() - INTERVAL '5 days' + INTERVAL '2 hours'),
    (ticket1_id, agent2_id, 'note', 'Found the booking in system. Email was sent to wrong address (typo). Resending confirmation now.', true, NOW() - INTERVAL '4 days'),
    
    (ticket2_id, agent2_id, 'call_in', 'Customer called requesting refund. Flight was cancelled due to weather. Provided booking reference and original receipt.', false, NOW() - INTERVAL '3 days'),
    (ticket2_id, agent3_id, 'note', 'Verified flight cancellation with airline. Refund approved per policy. Processing through payment system.', true, NOW() - INTERVAL '2 days'),
    (ticket2_id, agent3_id, 'email_out', 'Dear Sarah,\n\nYour refund of $85 has been approved and will be processed within 5-7 business days.\n\nBest regards,\nAna', false, NOW() - INTERVAL '2 days' + INTERVAL '1 hour'),
    
    (ticket3_id, agent1_id, 'chat', 'Customer: The driver was supposed to pick me up at 6 AM but arrived at 6:25 AM. I almost missed my flight!\n\nAgent: I sincerely apologize for this inconvenience. Let me look into this immediately.', false, NOW() - INTERVAL '1 day'),
    
    (ticket4_id, agent3_id, 'email_in', 'Hi, I need to change my transfer date from December 20 to December 22. Is this possible? My booking ref is BK-2024-5678.', false, NOW() - INTERVAL '7 days'),
    (ticket4_id, agent3_id, 'email_out', 'Dear Emily,\n\nYour booking has been successfully modified to December 22. A new confirmation email has been sent.\n\nBest regards,\nAna', false, NOW() - INTERVAL '6 days'),
    
    (ticket5_id, agent1_id, 'email_in', 'We are getting HTTP 500 errors when calling the availability sync endpoint. Started happening this morning. Request ID: REQ-789012', false, NOW() - INTERVAL '2 days'),
    (ticket5_id, agent2_id, 'note', 'Escalated to technical team. Checking server logs for the request ID.', true, NOW() - INTERVAL '2 days' + INTERVAL '30 minutes'),
    (ticket5_id, agent2_id, 'email_out', 'Hi Paradise Tours team,\n\nWe are investigating the API errors. Our technical team has identified a potential issue with the authentication token refresh. We will provide an update within 24 hours.\n\nBest regards,\nCarlos', false, NOW() - INTERVAL '1 day');

  -- Insert follow-ups
  INSERT INTO ticket_follow_ups (ticket_id, agent_id, due_date, reminder_date, note, status, created_at) VALUES
    (ticket1_id, agent2_id, NOW() + INTERVAL '1 day', NOW() + INTERVAL '12 hours', 'Confirm customer received the resent confirmation email', 'pending', NOW() - INTERVAL '4 days'),
    (ticket2_id, agent3_id, NOW() + INTERVAL '5 days', NOW() + INTERVAL '4 days', 'Verify refund was processed successfully', 'pending', NOW() - INTERVAL '2 days'),
    (ticket3_id, agent1_id, NOW() + INTERVAL '2 hours', NOW(), 'Urgent: Investigate driver delay and prepare compensation offer', 'pending', NOW() - INTERVAL '1 day'),
    (ticket5_id, agent2_id, NOW() + INTERVAL '12 hours', NOW() + INTERVAL '6 hours', 'Follow up with technical team on API fix status', 'pending', NOW() - INTERVAL '1 day');

  -- Insert tags
  INSERT INTO ticket_tags (ticket_id, tag) VALUES
    (ticket1_id, 'email-issue'),
    (ticket1_id, 'booking'),
    (ticket2_id, 'refund'),
    (ticket2_id, 'weather-related'),
    (ticket3_id, 'complaint'),
    (ticket3_id, 'driver-issue'),
    (ticket3_id, 'urgent'),
    (ticket4_id, 'modification'),
    (ticket5_id, 'api'),
    (ticket5_id, 'partner'),
    (ticket5_id, 'technical');
END $$;