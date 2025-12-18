/*
  # Analytics and Reporting Views - Complete Dashboard System

  ## Revenue Overview
  - Daily and monthly revenue breakdowns
  - Payment method analysis

  ## Conversion Tracking
  - Chat to booking conversion rates
  - Customer funnel metrics

  ## Airport Operations
  - Airport-specific performance metrics
  - Daily operational statistics

  ## Partner Performance
  - Partner revenue and commission tracking
  - Monthly partner analytics

  ## Driver Performance
  - Driver efficiency and ratings
  - Daily driver statistics

  ## Executive Dashboard
  - High-level business metrics
  - Service type performance analysis
*/

-- ============================================================================
-- 1. REVENUE OVERVIEW VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW daily_revenue_summary AS
SELECT
  DATE(b.created_at) as report_date,
  b.booking_type,
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT CASE WHEN b.payment_status = 'paid' THEN b.id END) as paid_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_bookings,
  SUM(CASE WHEN b.payment_status = 'paid' THEN COALESCE(b.price, 0) ELSE 0 END) as total_revenue,
  AVG(CASE WHEN b.payment_status = 'paid' THEN b.price END) as avg_booking_value
FROM bookings b
GROUP BY DATE(b.created_at), b.booking_type
ORDER BY report_date DESC, booking_type;

CREATE OR REPLACE VIEW monthly_revenue_summary AS
SELECT
  DATE_TRUNC('month', b.created_at) as report_month,
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT CASE WHEN b.payment_status = 'paid' THEN b.id END) as paid_bookings,
  SUM(CASE WHEN b.payment_status = 'paid' THEN COALESCE(b.price, 0) ELSE 0 END) as total_revenue,
  AVG(CASE WHEN b.payment_status = 'paid' THEN b.price END) as avg_booking_value,
  COUNT(DISTINCT b.customer_id) as unique_customers,
  COUNT(DISTINCT CASE WHEN b.booking_type = 'airport_transfer' THEN b.id END) as airport_bookings,
  COUNT(DISTINCT CASE WHEN b.booking_type = 'hotel' THEN b.id END) as hotel_bookings,
  COUNT(DISTINCT CASE WHEN b.booking_type = 'flight' THEN b.id END) as flight_bookings,
  COUNT(DISTINCT CASE WHEN b.booking_type = 'car_rental' THEN b.id END) as car_rental_bookings,
  COUNT(DISTINCT CASE WHEN b.booking_type = 'tour' THEN b.id END) as tour_bookings,
  SUM(CASE WHEN b.payment_status = 'paid' AND b.booking_type = 'airport_transfer' THEN COALESCE(b.price, 0) ELSE 0 END) as airport_revenue,
  SUM(CASE WHEN b.payment_status = 'paid' AND b.booking_type = 'hotel' THEN COALESCE(b.price, 0) ELSE 0 END) as hotel_revenue,
  SUM(CASE WHEN b.payment_status = 'paid' AND b.booking_type = 'flight' THEN COALESCE(b.price, 0) ELSE 0 END) as flight_revenue,
  SUM(CASE WHEN b.payment_status = 'paid' AND b.booking_type = 'car_rental' THEN COALESCE(b.price, 0) ELSE 0 END) as car_rental_revenue,
  SUM(CASE WHEN b.payment_status = 'paid' AND b.booking_type = 'tour' THEN COALESCE(b.price, 0) ELSE 0 END) as tour_revenue
FROM bookings b
GROUP BY DATE_TRUNC('month', b.created_at)
ORDER BY report_month DESC;

CREATE OR REPLACE VIEW revenue_by_payment_method AS
SELECT
  DATE(p.created_at) as report_date,
  p.payment_method,
  COUNT(DISTINCT p.id) as transaction_count,
  SUM(COALESCE(p.amount, 0)) as total_amount,
  AVG(p.amount) as avg_transaction_value,
  MIN(p.amount) as min_transaction,
  MAX(p.amount) as max_transaction
FROM payments p
WHERE p.status = 'completed'
GROUP BY DATE(p.created_at), p.payment_method
ORDER BY report_date DESC, total_amount DESC;

-- ============================================================================
-- 2. CONVERSION TRACKING VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW chat_booking_conversion AS
SELECT
  DATE(cal.timestamp) as report_date,
  COUNT(DISTINCT cal.customer_id) as total_active_users,
  COUNT(DISTINCT CASE WHEN cal.activity_type = 'booking_created' THEN cal.customer_id END) as bookings_completed,
  COUNT(DISTINCT CASE WHEN cal.activity_type = 'payment_received' THEN cal.customer_id END) as bookings_paid,
  ROUND(
    (COUNT(DISTINCT CASE WHEN cal.activity_type = 'booking_created' THEN cal.customer_id END)::numeric /
    NULLIF(COUNT(DISTINCT cal.customer_id), 0)) * 100,
    2
  ) as booking_rate,
  ROUND(
    (COUNT(DISTINCT CASE WHEN cal.activity_type = 'payment_received' THEN cal.customer_id END)::numeric /
    NULLIF(COUNT(DISTINCT cal.customer_id), 0)) * 100,
    2
  ) as payment_rate
FROM customer_activity_log cal
GROUP BY DATE(cal.timestamp)
ORDER BY report_date DESC;

CREATE OR REPLACE VIEW customer_conversion_funnel AS
SELECT
  DATE_TRUNC('week', c.created_at) as report_week,
  COUNT(DISTINCT c.id) as total_customers,
  COUNT(DISTINCT b.customer_id) as customers_with_bookings,
  COUNT(DISTINCT CASE WHEN b.payment_status = 'paid' THEN b.customer_id END) as paying_customers,
  COUNT(DISTINCT CASE WHEN c.total_bookings > 1 THEN c.id END) as repeat_customers,
  ROUND(
    (COUNT(DISTINCT b.customer_id)::numeric / NULLIF(COUNT(DISTINCT c.id), 0)) * 100,
    2
  ) as customer_booking_rate,
  ROUND(
    (COUNT(DISTINCT CASE WHEN b.payment_status = 'paid' THEN b.customer_id END)::numeric /
    NULLIF(COUNT(DISTINCT c.id), 0)) * 100,
    2
  ) as customer_conversion_rate
FROM customers c
LEFT JOIN bookings b ON c.id = b.customer_id
GROUP BY DATE_TRUNC('week', c.created_at)
ORDER BY report_week DESC;

-- ============================================================================
-- 3. AIRPORT PERFORMANCE VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW airport_performance_metrics AS
SELECT
  b.pickup_address as airport_name,
  COUNT(DISTINCT b.id) as total_transfers,
  COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_transfers,
  COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_transfers,
  SUM(CASE WHEN b.payment_status = 'paid' THEN COALESCE(b.price, 0) ELSE 0 END) as total_revenue,
  AVG(CASE WHEN b.payment_status = 'paid' THEN b.price END) as avg_transfer_price,
  ROUND(
    (COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END)::numeric /
    NULLIF(COUNT(DISTINCT b.id), 0)) * 100,
    2
  ) as completion_rate,
  AVG(CASE
    WHEN ta.driver_arrived_at IS NOT NULL AND b.pickup_datetime IS NOT NULL
    THEN EXTRACT(EPOCH FROM (ta.driver_arrived_at - b.pickup_datetime)) / 60
  END) as avg_delay_minutes,
  COUNT(DISTINCT ta.driver_id) as active_drivers
FROM bookings b
LEFT JOIN trip_assignments ta ON b.id = ta.booking_id
WHERE b.booking_type = 'airport_transfer' AND b.pickup_address IS NOT NULL
GROUP BY b.pickup_address
ORDER BY total_revenue DESC;

CREATE OR REPLACE VIEW airport_daily_operations AS
SELECT
  DATE(b.pickup_datetime) as operation_date,
  b.pickup_address as airport_name,
  COUNT(DISTINCT b.id) as scheduled_transfers,
  COUNT(DISTINCT CASE WHEN ta.status = 'completed' THEN b.id END) as completed_transfers,
  COUNT(DISTINCT CASE WHEN ta.status IN ('en_route_pickup', 'in_progress') THEN b.id END) as in_progress_transfers,
  COUNT(DISTINCT CASE WHEN ta.status = 'assigned' THEN b.id END) as pending_transfers,
  COUNT(DISTINCT ta.driver_id) as drivers_deployed,
  SUM(CASE WHEN b.payment_status = 'paid' THEN COALESCE(b.price, 0) ELSE 0 END) as daily_revenue,
  AVG(CASE
    WHEN ta.driver_arrived_at IS NOT NULL AND b.pickup_datetime IS NOT NULL
    THEN EXTRACT(EPOCH FROM (ta.driver_arrived_at - b.pickup_datetime)) / 60
  END) as avg_delay_minutes
FROM bookings b
LEFT JOIN trip_assignments ta ON b.id = ta.booking_id
WHERE b.booking_type = 'airport_transfer' AND b.pickup_address IS NOT NULL
GROUP BY DATE(b.pickup_datetime), b.pickup_address
ORDER BY operation_date DESC, scheduled_transfers DESC;

-- ============================================================================
-- 4. PARTNER PERFORMANCE VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW partner_performance_summary AS
SELECT
  p.id as partner_id,
  p.business_name,
  p.business_type as partner_type,
  p.status as partner_status,
  COUNT(DISTINCT o.id) as total_orders,
  COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) as completed_orders,
  COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END) as cancelled_orders,
  SUM(CASE WHEN o.payment_status = 'completed' THEN COALESCE(o.total_price, 0) ELSE 0 END) as total_revenue,
  SUM(CASE WHEN pt.status = 'approved' THEN COALESCE(pt.net_amount, 0) ELSE 0 END) as total_commissions_earned,
  SUM(CASE WHEN pp.status = 'paid' THEN COALESCE(pp.amount, 0) ELSE 0 END) as total_payouts_received,
  ROUND(
    (COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END)::numeric /
    NULLIF(COUNT(DISTINCT o.id), 0)) * 100,
    2
  ) as completion_rate,
  ROUND(
    (COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END)::numeric /
    NULLIF(COUNT(DISTINCT o.id), 0)) * 100,
    2
  ) as cancellation_rate
FROM partners p
LEFT JOIN orders o ON p.id = o.partner_id
LEFT JOIN partner_transactions pt ON p.id = pt.partner_id
LEFT JOIN partner_payouts pp ON p.id = pp.partner_id
GROUP BY p.id, p.business_name, p.business_type, p.status
ORDER BY total_revenue DESC;

CREATE OR REPLACE VIEW partner_monthly_stats AS
SELECT
  DATE_TRUNC('month', o.created_at) as report_month,
  p.id as partner_id,
  p.business_name,
  p.business_type as partner_type,
  COUNT(DISTINCT o.id) as monthly_orders,
  COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) as completed_orders,
  SUM(CASE WHEN o.payment_status = 'completed' THEN COALESCE(o.total_price, 0) ELSE 0 END) as monthly_revenue,
  SUM(CASE WHEN pt.status = 'approved' AND DATE_TRUNC('month', pt.created_at) = DATE_TRUNC('month', o.created_at) 
    THEN COALESCE(pt.net_amount, 0) ELSE 0 END) as monthly_commission
FROM partners p
LEFT JOIN orders o ON p.id = o.partner_id
LEFT JOIN partner_transactions pt ON p.id = pt.partner_id
WHERE o.created_at IS NOT NULL
GROUP BY DATE_TRUNC('month', o.created_at), p.id, p.business_name, p.business_type
ORDER BY report_month DESC, monthly_revenue DESC;

-- ============================================================================
-- 5. DRIVER PERFORMANCE VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW driver_performance_summary AS
SELECT
  d.id as driver_id,
  d.first_name || ' ' || d.last_name as driver_name,
  d.status as driver_status,
  v.make || ' ' || v.model as vehicle_info,
  v.capacity as vehicle_capacity,
  COUNT(DISTINCT ta.id) as total_assignments,
  COUNT(DISTINCT CASE WHEN ta.status = 'completed' THEN ta.id END) as completed_trips,
  COUNT(DISTINCT CASE WHEN ta.status = 'cancelled' THEN ta.id END) as cancelled_trips,
  d.rating as avg_rating,
  d.total_trips,
  AVG(CASE
    WHEN ta.driver_arrived_at IS NOT NULL AND b.pickup_datetime IS NOT NULL
    THEN EXTRACT(EPOCH FROM (ta.driver_arrived_at - b.pickup_datetime)) / 60
  END) as avg_delay_minutes,
  ROUND(
    (COUNT(DISTINCT CASE WHEN ta.status = 'completed' THEN ta.id END)::numeric /
    NULLIF(COUNT(DISTINCT ta.id), 0)) * 100,
    2
  ) as completion_rate,
  MAX(ta.dropoff_completed_at) as last_trip_date
FROM drivers d
LEFT JOIN vehicles v ON d.vehicle_id = v.id
LEFT JOIN trip_assignments ta ON d.id = ta.driver_id
LEFT JOIN bookings b ON ta.booking_id = b.id
GROUP BY d.id, d.first_name, d.last_name, d.status, d.rating, d.total_trips, v.make, v.model, v.capacity
ORDER BY d.total_trips DESC;

CREATE OR REPLACE VIEW driver_daily_stats AS
SELECT
  DATE(ta.assigned_at) as report_date,
  d.id as driver_id,
  d.first_name || ' ' || d.last_name as driver_name,
  COUNT(DISTINCT ta.id) as daily_assignments,
  COUNT(DISTINCT CASE WHEN ta.status = 'completed' THEN ta.id END) as completed_trips,
  AVG(CASE
    WHEN ta.driver_arrived_at IS NOT NULL AND b.pickup_datetime IS NOT NULL
    THEN EXTRACT(EPOCH FROM (ta.driver_arrived_at - b.pickup_datetime)) / 60
  END) as avg_delay_minutes,
  MIN(ta.driver_arrived_at) as first_pickup_time,
  MAX(ta.dropoff_completed_at) as last_dropoff_time,
  CASE 
    WHEN MAX(ta.dropoff_completed_at) IS NOT NULL AND MIN(ta.driver_arrived_at) IS NOT NULL
    THEN EXTRACT(EPOCH FROM (MAX(ta.dropoff_completed_at) - MIN(ta.driver_arrived_at))) / 3600
    ELSE 0
  END as hours_active
FROM drivers d
LEFT JOIN trip_assignments ta ON d.id = ta.driver_id
LEFT JOIN bookings b ON ta.booking_id = b.id
WHERE ta.assigned_at IS NOT NULL
GROUP BY DATE(ta.assigned_at), d.id, d.first_name, d.last_name
ORDER BY report_date DESC, completed_trips DESC;

-- ============================================================================
-- 6. EXECUTIVE DASHBOARD VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW executive_dashboard_metrics AS
SELECT
  DATE_TRUNC('month', b.created_at) as report_month,
  SUM(CASE WHEN b.payment_status = 'paid' THEN COALESCE(b.price, 0) ELSE 0 END) as total_revenue,
  AVG(CASE WHEN b.payment_status = 'paid' THEN b.price END) as avg_booking_value,
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT CASE WHEN b.payment_status = 'paid' THEN b.id END) as paid_bookings,
  COUNT(DISTINCT b.customer_id) as unique_customers,
  COUNT(DISTINCT ta.driver_id) as active_drivers,
  COUNT(DISTINCT o.partner_id) as active_partners,
  COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_bookings,
  ROUND(
    (COUNT(DISTINCT CASE WHEN b.payment_status = 'paid' THEN b.id END)::numeric /
    NULLIF(COUNT(DISTINCT b.id), 0)) * 100,
    2
  ) as payment_conversion_rate,
  ROUND(
    (COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END)::numeric /
    NULLIF(COUNT(DISTINCT b.id), 0)) * 100,
    2
  ) as completion_rate,
  SUM(CASE WHEN pt.status = 'approved' THEN COALESCE(pt.net_amount, 0) ELSE 0 END) as total_commissions_paid,
  SUM(CASE WHEN b.payment_status = 'paid' THEN COALESCE(b.price, 0) ELSE 0 END) -
    SUM(CASE WHEN pt.status = 'approved' THEN COALESCE(pt.net_amount, 0) ELSE 0 END) as net_platform_revenue
FROM bookings b
LEFT JOIN trip_assignments ta ON b.id = ta.booking_id
LEFT JOIN partner_transactions pt ON b.id = pt.booking_id
LEFT JOIN orders o ON b.reference_id = o.id AND b.booking_type IN ('hotel', 'flight', 'tour', 'car_rental')
GROUP BY DATE_TRUNC('month', b.created_at)
ORDER BY report_month DESC;

CREATE OR REPLACE VIEW service_type_performance AS
SELECT
  b.booking_type,
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT CASE WHEN b.payment_status = 'paid' THEN b.id END) as paid_bookings,
  SUM(CASE WHEN b.payment_status = 'paid' THEN COALESCE(b.price, 0) ELSE 0 END) as total_revenue,
  AVG(CASE WHEN b.payment_status = 'paid' THEN b.price END) as avg_booking_value,
  COUNT(DISTINCT b.customer_id) as unique_customers,
  ROUND(
    (COUNT(DISTINCT CASE WHEN b.payment_status = 'paid' THEN b.id END)::numeric /
    NULLIF(COUNT(DISTINCT b.id), 0)) * 100,
    2
  ) as conversion_rate
FROM bookings b
GROUP BY b.booking_type
ORDER BY total_revenue DESC;

GRANT SELECT ON daily_revenue_summary TO authenticated;
GRANT SELECT ON monthly_revenue_summary TO authenticated;
GRANT SELECT ON revenue_by_payment_method TO authenticated;
GRANT SELECT ON chat_booking_conversion TO authenticated;
GRANT SELECT ON customer_conversion_funnel TO authenticated;
GRANT SELECT ON airport_performance_metrics TO authenticated;
GRANT SELECT ON airport_daily_operations TO authenticated;
GRANT SELECT ON partner_performance_summary TO authenticated;
GRANT SELECT ON partner_monthly_stats TO authenticated;
GRANT SELECT ON driver_performance_summary TO authenticated;
GRANT SELECT ON driver_daily_stats TO authenticated;
GRANT SELECT ON executive_dashboard_metrics TO authenticated;
GRANT SELECT ON service_type_performance TO authenticated;
