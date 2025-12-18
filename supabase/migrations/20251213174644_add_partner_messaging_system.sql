/*
  # Partner Messaging System
  
  1. New Tables
    - `partner_messages`
      - `id` (uuid, primary key) - Unique message identifier
      - `partner_id` (uuid, foreign key) - Reference to partner
      - `order_id` (uuid, foreign key) - Reference to related order (optional)
      - `message_type` (text) - Type of message (new_order, order_update, system, etc.)
      - `subject` (text) - Message subject line
      - `content` (text) - Message body content
      - `metadata` (jsonb) - Additional structured data
      - `is_read` (boolean) - Read status
      - `priority` (text) - Message priority (low, normal, high, urgent)
      - `created_at` (timestamptz) - Message creation timestamp
    
    - `partner_notification_settings`
      - `id` (uuid, primary key)
      - `partner_id` (uuid, foreign key) - Reference to partner
      - `email_on_new_order` (boolean) - Email notification for new orders
      - `email_on_order_update` (boolean) - Email notification for order updates
      - `email_on_cancellation` (boolean) - Email notification for cancellations
      - `in_app_notifications` (boolean) - Show in-app notifications
      - `notification_email` (text) - Email address for notifications
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for public access (demo mode)
  
  3. Indexes
    - Add indexes for common queries
  
  4. Functions
    - Function to create notification when order is placed
*/

-- Partner Messages Table
CREATE TABLE IF NOT EXISTS partner_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  message_type text NOT NULL DEFAULT 'system',
  subject text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  priority text DEFAULT 'normal',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE partner_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partner_messages' AND policyname = 'Anyone can view partner messages'
  ) THEN
    CREATE POLICY "Anyone can view partner messages" ON partner_messages FOR SELECT TO public USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partner_messages' AND policyname = 'Anyone can create partner messages'
  ) THEN
    CREATE POLICY "Anyone can create partner messages" ON partner_messages FOR INSERT TO public WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partner_messages' AND policyname = 'Anyone can update partner messages'
  ) THEN
    CREATE POLICY "Anyone can update partner messages" ON partner_messages FOR UPDATE TO public USING (true) WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partner_messages' AND policyname = 'Anyone can delete partner messages'
  ) THEN
    CREATE POLICY "Anyone can delete partner messages" ON partner_messages FOR DELETE TO public USING (true);
  END IF;
END $$;

-- Partner Notification Settings Table
CREATE TABLE IF NOT EXISTS partner_notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid UNIQUE NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  email_on_new_order boolean DEFAULT true,
  email_on_order_update boolean DEFAULT true,
  email_on_cancellation boolean DEFAULT true,
  in_app_notifications boolean DEFAULT true,
  notification_email text,
  daily_digest boolean DEFAULT false,
  digest_time time DEFAULT '09:00:00',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE partner_notification_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partner_notification_settings' AND policyname = 'Anyone can view notification settings'
  ) THEN
    CREATE POLICY "Anyone can view notification settings" ON partner_notification_settings FOR SELECT TO public USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partner_notification_settings' AND policyname = 'Anyone can create notification settings'
  ) THEN
    CREATE POLICY "Anyone can create notification settings" ON partner_notification_settings FOR INSERT TO public WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partner_notification_settings' AND policyname = 'Anyone can update notification settings'
  ) THEN
    CREATE POLICY "Anyone can update notification settings" ON partner_notification_settings FOR UPDATE TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_messages_partner_id ON partner_messages(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_messages_order_id ON partner_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_partner_messages_is_read ON partner_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_partner_messages_message_type ON partner_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_partner_messages_created_at ON partner_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_messages_priority ON partner_messages(priority);
CREATE INDEX IF NOT EXISTS idx_partner_notification_settings_partner_id ON partner_notification_settings(partner_id);

-- Function to automatically create a message when an order is placed
CREATE OR REPLACE FUNCTION create_order_notification()
RETURNS TRIGGER AS $$
DECLARE
  partner_record RECORD;
BEGIN
  IF NEW.partner_id IS NOT NULL THEN
    SELECT business_name, email INTO partner_record
    FROM partners
    WHERE id = NEW.partner_id;
    
    INSERT INTO partner_messages (
      partner_id,
      order_id,
      message_type,
      subject,
      content,
      metadata,
      priority
    ) VALUES (
      NEW.partner_id,
      NEW.id,
      'new_order',
      'New Booking: ' || NEW.item_name,
      'You have received a new ' || NEW.booking_type || ' booking from ' || NEW.customer_name || '.' ||
      ' Total amount: $' || NEW.total_price || '.' ||
      CASE 
        WHEN NEW.check_in_date IS NOT NULL THEN ' Date: ' || to_char(NEW.check_in_date, 'Mon DD, YYYY')
        ELSE ''
      END,
      jsonb_build_object(
        'customer_name', NEW.customer_name,
        'customer_email', NEW.customer_email,
        'customer_phone', NEW.customer_phone,
        'booking_type', NEW.booking_type,
        'item_name', NEW.item_name,
        'total_price', NEW.total_price,
        'check_in_date', NEW.check_in_date,
        'check_out_date', NEW.check_out_date
      ),
      'high'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'order_notification_trigger'
  ) THEN
    CREATE TRIGGER order_notification_trigger
      AFTER INSERT ON orders
      FOR EACH ROW
      EXECUTE FUNCTION create_order_notification();
  END IF;
END $$;

-- Function to create notification on order status change
CREATE OR REPLACE FUNCTION create_order_update_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.partner_id IS NOT NULL AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO partner_messages (
      partner_id,
      order_id,
      message_type,
      subject,
      content,
      metadata,
      priority
    ) VALUES (
      NEW.partner_id,
      NEW.id,
      'order_update',
      'Order Status Updated: ' || NEW.item_name,
      'Order #' || substring(NEW.id::text, 1, 8) || ' status changed from ' || COALESCE(OLD.status, 'unknown') || ' to ' || NEW.status || '.',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'order_id', NEW.id,
        'item_name', NEW.item_name
      ),
      CASE 
        WHEN NEW.status = 'cancelled' THEN 'urgent'
        ELSE 'normal'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'order_update_notification_trigger'
  ) THEN
    CREATE TRIGGER order_update_notification_trigger
      AFTER UPDATE ON orders
      FOR EACH ROW
      EXECUTE FUNCTION create_order_update_notification();
  END IF;
END $$;

-- Insert default notification settings for existing partners
INSERT INTO partner_notification_settings (partner_id, notification_email)
SELECT p.id, p.email
FROM partners p
WHERE NOT EXISTS (
  SELECT 1 FROM partner_notification_settings pns WHERE pns.partner_id = p.id
)
ON CONFLICT (partner_id) DO NOTHING;

-- Create trigger to auto-create notification settings for new partners
CREATE OR REPLACE FUNCTION create_partner_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO partner_notification_settings (partner_id, notification_email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (partner_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'partner_notification_settings_trigger'
  ) THEN
    CREATE TRIGGER partner_notification_settings_trigger
      AFTER INSERT ON partners
      FOR EACH ROW
      EXECUTE FUNCTION create_partner_notification_settings();
  END IF;
END $$;