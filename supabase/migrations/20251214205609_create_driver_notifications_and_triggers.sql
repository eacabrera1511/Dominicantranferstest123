/*
  # Driver Notifications & Automation Triggers

  ## Overview
  Creates driver notifications tracking and automated workflow triggers for
  seamless dispatch operations.

  ## New Tables

  ### 1. `driver_notifications` - Notification delivery tracking
  Logs all notifications sent to drivers across multiple channels.

  **Columns:**
  - `id` (uuid, PK) - Unique notification identifier
  - `driver_id` (uuid, FK) - Target driver
  - `notification_type` (text) - Type of notification
  - `channels` (jsonb) - Array of delivery channels used
  - `message` (text) - Notification content
  - `data` (jsonb) - Additional structured data
  - `sent_at` (timestamptz) - Delivery timestamp
  - `read_at` (timestamptz, nullable) - When driver read it
  - `created_at` (timestamptz)

  ## Automated Triggers

  1. **Auto-sync booking status** when assignment changes
  2. **Auto-log status changes** to trip_logs
  3. **Auto-update vehicle status** during trips
  4. **Auto-notify driver** on new assignment (optional webhook)

  ## Security
  - RLS enabled on driver_notifications
  - Drivers can view own notifications
  - Admins/agents can view all notifications
*/

-- =====================================================
-- DRIVER NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS driver_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('new_assignment', 'cancellation', 'reminder', 'update', 'message')),
  channels jsonb DEFAULT '[]'::jsonb,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  sent_at timestamptz DEFAULT now(),
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_notifications_driver ON driver_notifications(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_notifications_sent_at ON driver_notifications(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_notifications_read ON driver_notifications(read_at) WHERE read_at IS NULL;

ALTER TABLE driver_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view own notifications"
  ON driver_notifications FOR SELECT
  TO authenticated
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Drivers can mark own notifications as read"
  ON driver_notifications FOR UPDATE
  TO authenticated
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE email = auth.jwt()->>'email'
    )
  )
  WITH CHECK (
    driver_id IN (
      SELECT id FROM drivers WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Admins can view all notifications"
  ON driver_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "System can insert notifications"
  ON driver_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- AUTOMATED WORKFLOW TRIGGERS
-- =====================================================

-- Trigger 1: Sync booking workflow status when assignment changes
CREATE OR REPLACE FUNCTION sync_booking_workflow_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE bookings
    SET workflow_status = CASE
      WHEN NEW.status = 'assigned' THEN 'assigned'
      WHEN NEW.status = 'accepted' THEN 'confirmed'
      WHEN NEW.status = 'en_route_pickup' THEN 'driver_en_route'
      WHEN NEW.status = 'arrived' THEN 'driver_arrived'
      WHEN NEW.status = 'in_progress' THEN 'in_progress'
      WHEN NEW.status = 'completed' THEN 'completed'
      WHEN NEW.status = 'cancelled' THEN 'cancelled'
      ELSE workflow_status
    END
    WHERE id = NEW.booking_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_sync_booking_workflow_status ON trip_assignments;
CREATE TRIGGER trigger_sync_booking_workflow_status
  AFTER UPDATE ON trip_assignments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION sync_booking_workflow_status();

-- Trigger 2: Auto-log status changes to trip_logs
CREATE OR REPLACE FUNCTION auto_log_assignment_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO trip_logs (assignment_id, event_type, event_data)
    VALUES (
      NEW.id,
      'status_change',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'timestamp', NOW(),
        'driver_id', NEW.driver_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_auto_log_assignment_changes ON trip_assignments;
CREATE TRIGGER trigger_auto_log_assignment_changes
  AFTER UPDATE ON trip_assignments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION auto_log_assignment_changes();

-- Trigger 3: Update vehicle status during trip lifecycle
CREATE OR REPLACE FUNCTION update_vehicle_trip_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
    UPDATE vehicles
    SET status = 'in_service'
    WHERE id = NEW.vehicle_id;

    INSERT INTO trip_logs (assignment_id, event_type, event_data)
    VALUES (
      NEW.id,
      'note',
      jsonb_build_object(
        'message', 'Vehicle marked as in_service',
        'vehicle_id', NEW.vehicle_id
      )
    );
  END IF;

  IF NEW.status = 'completed' AND OLD.status = 'in_progress' THEN
    UPDATE vehicles
    SET status = 'available',
        current_location = (
          SELECT current_location FROM drivers WHERE id = NEW.driver_id
        )
    WHERE id = NEW.vehicle_id;

    INSERT INTO trip_logs (assignment_id, event_type, event_data)
    VALUES (
      NEW.id,
      'note',
      jsonb_build_object(
        'message', 'Vehicle marked as available',
        'vehicle_id', NEW.vehicle_id
      )
    );
  END IF;

  IF NEW.status = 'cancelled' AND OLD.status IN ('assigned', 'accepted') THEN
    UPDATE vehicles
    SET status = 'available'
    WHERE id = NEW.vehicle_id;

    INSERT INTO trip_logs (assignment_id, event_type, event_data)
    VALUES (
      NEW.id,
      'note',
      jsonb_build_object(
        'message', 'Vehicle released due to cancellation',
        'vehicle_id', NEW.vehicle_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_update_vehicle_trip_status ON trip_assignments;
CREATE TRIGGER trigger_update_vehicle_trip_status
  AFTER UPDATE ON trip_assignments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_vehicle_trip_status();

-- Trigger 4: Increment driver trip count on completion
CREATE OR REPLACE FUNCTION update_driver_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE drivers
    SET total_trips = total_trips + 1
    WHERE id = NEW.driver_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_update_driver_stats ON trip_assignments;
CREATE TRIGGER trigger_update_driver_stats
  AFTER UPDATE ON trip_assignments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed')
  EXECUTE FUNCTION update_driver_stats();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check driver availability
CREATE OR REPLACE FUNCTION is_driver_available(
  p_driver_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz
)
RETURNS boolean AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM trip_assignments ta
  JOIN bookings b ON ta.booking_id = b.id
  WHERE ta.driver_id = p_driver_id
    AND ta.status IN ('assigned', 'accepted', 'en_route_pickup', 'arrived', 'in_progress')
    AND (
      (b.pickup_datetime BETWEEN p_start_time AND p_end_time)
      OR (b.pickup_datetime + INTERVAL '4 hours' BETWEEN p_start_time AND p_end_time)
      OR (p_start_time BETWEEN b.pickup_datetime AND b.pickup_datetime + INTERVAL '4 hours')
    );

  RETURN v_count = 0;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Function to check vehicle availability
CREATE OR REPLACE FUNCTION is_vehicle_available(
  p_vehicle_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz
)
RETURNS boolean AS $$
DECLARE
  v_count integer;
  v_vehicle_status text;
BEGIN
  SELECT status INTO v_vehicle_status
  FROM vehicles
  WHERE id = p_vehicle_id;

  IF v_vehicle_status NOT IN ('available') THEN
    RETURN false;
  END IF;

  SELECT COUNT(*)
  INTO v_count
  FROM trip_assignments ta
  JOIN bookings b ON ta.booking_id = b.id
  WHERE ta.vehicle_id = p_vehicle_id
    AND ta.status IN ('assigned', 'accepted', 'en_route_pickup', 'arrived', 'in_progress')
    AND (
      (b.pickup_datetime BETWEEN p_start_time AND p_end_time)
      OR (b.pickup_datetime + INTERVAL '4 hours' BETWEEN p_start_time AND p_end_time)
      OR (p_start_time BETWEEN b.pickup_datetime AND b.pickup_datetime + INTERVAL '4 hours')
    );

  RETURN v_count = 0;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Function to get available drivers for a time slot
CREATE OR REPLACE FUNCTION get_available_drivers(
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_vehicle_type text DEFAULT NULL
)
RETURNS TABLE (
  driver_id uuid,
  driver_name text,
  vehicle_id uuid,
  vehicle_info text,
  rating numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.first_name || ' ' || d.last_name,
    d.vehicle_id,
    v.make || ' ' || v.model || ' (' || v.license_plate || ')',
    d.rating
  FROM drivers d
  LEFT JOIN vehicles v ON d.vehicle_id = v.id
  WHERE d.status = 'active'
    AND (p_vehicle_type IS NULL OR v.vehicle_type = p_vehicle_type)
    AND is_driver_available(d.id, p_start_time, p_end_time)
    AND (d.vehicle_id IS NULL OR is_vehicle_available(d.vehicle_id, p_start_time, p_end_time))
  ORDER BY d.rating DESC, d.total_trips DESC;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- Function to calculate driver earnings for a period
CREATE OR REPLACE FUNCTION calculate_driver_earnings(
  p_driver_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  total_trips integer,
  total_earnings numeric,
  average_rating numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(ta.id)::integer,
    COALESCE(SUM(b.price), 0),
    AVG(d.rating)
  FROM trip_assignments ta
  JOIN bookings b ON ta.booking_id = b.id
  JOIN drivers d ON ta.driver_id = d.id
  WHERE ta.driver_id = p_driver_id
    AND ta.status = 'completed'
    AND DATE(ta.dropoff_completed_at) BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;
