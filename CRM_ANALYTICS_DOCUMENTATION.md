# CRM Analytics & Reporting Documentation

## Overview

This document provides comprehensive specifications for the CRM analytics and reporting system. The analytics infrastructure consists of 13 SQL views that provide real-time insights into revenue, conversions, operations, and performance across the platform.

---

## Table of Contents

1. [Revenue Overview](#1-revenue-overview)
2. [Conversion Tracking](#2-conversion-tracking)
3. [Airport Performance](#3-airport-performance)
4. [Partner Performance](#4-partner-performance)
5. [Driver Performance](#5-driver-performance)
6. [Executive Dashboard](#6-executive-dashboard)

---

## 1. Revenue Overview

### 1.1 Daily Revenue Summary

**View:** `daily_revenue_summary`

**Purpose:** Track daily revenue performance by booking type with granular payment status breakdown.

**Metrics:**

| Metric | Definition | Calculation |
|--------|------------|-------------|
| `report_date` | Date of the bookings | `DATE(bookings.created_at)` |
| `booking_type` | Service category | airport_transfer, hotel, flight, car_rental, tour |
| `total_bookings` | All bookings created | `COUNT(DISTINCT bookings.id)` |
| `paid_bookings` | Bookings with completed payment | `COUNT WHERE payment_status = 'paid'` |
| `cancelled_bookings` | Cancelled reservations | `COUNT WHERE status = 'cancelled'` |
| `total_revenue` | Sum of all paid booking prices | `SUM(price) WHERE payment_status = 'paid'` |
| `avg_booking_value` | Average transaction size | `AVG(price) WHERE payment_status = 'paid'` |

**Usage Example:**

```sql
-- Get today's revenue by service type
SELECT
  booking_type,
  total_bookings,
  total_revenue,
  avg_booking_value
FROM daily_revenue_summary
WHERE report_date = CURRENT_DATE
ORDER BY total_revenue DESC;
```

**Business Use Cases:**
- Daily revenue tracking and forecasting
- Service type performance comparison
- Identify high-value service categories
- Monitor payment conversion rates

---

### 1.2 Monthly Revenue Summary

**View:** `monthly_revenue_summary`

**Purpose:** Aggregate monthly performance metrics for strategic planning and trend analysis.

**Metrics:**

| Metric | Definition | Calculation |
|--------|------------|-------------|
| `report_month` | Month start date | `DATE_TRUNC('month', bookings.created_at)` |
| `total_bookings` | Monthly booking volume | `COUNT(DISTINCT bookings.id)` |
| `paid_bookings` | Successfully paid bookings | `COUNT WHERE payment_status = 'paid'` |
| `total_revenue` | Monthly gross revenue | `SUM(price) WHERE payment_status = 'paid'` |
| `avg_booking_value` | Average order value | `AVG(price) WHERE payment_status = 'paid'` |
| `unique_customers` | Distinct customers served | `COUNT(DISTINCT customer_id)` |
| `airport_bookings` | Airport transfer count | `COUNT WHERE booking_type = 'airport_transfer'` |
| `hotel_bookings` | Hotel booking count | `COUNT WHERE booking_type = 'hotel'` |
| `flight_bookings` | Flight booking count | `COUNT WHERE booking_type = 'flight'` |
| `car_rental_bookings` | Car rental count | `COUNT WHERE booking_type = 'car_rental'` |
| `tour_bookings` | Tour/activity count | `COUNT WHERE booking_type = 'tour'` |
| `airport_revenue` | Airport transfer revenue | Service-specific revenue breakdown |
| `hotel_revenue` | Hotel booking revenue | Service-specific revenue breakdown |
| `flight_revenue` | Flight booking revenue | Service-specific revenue breakdown |
| `car_rental_revenue` | Car rental revenue | Service-specific revenue breakdown |
| `tour_revenue` | Tour/activity revenue | Service-specific revenue breakdown |

**Usage Example:**

```sql
-- Compare current month to previous month
WITH current_month AS (
  SELECT * FROM monthly_revenue_summary
  WHERE report_month = DATE_TRUNC('month', CURRENT_DATE)
),
previous_month AS (
  SELECT * FROM monthly_revenue_summary
  WHERE report_month = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
)
SELECT
  c.total_revenue - p.total_revenue as revenue_growth,
  c.unique_customers - p.unique_customers as customer_growth,
  ROUND(((c.total_revenue / p.total_revenue) - 1) * 100, 2) as growth_percentage
FROM current_month c, previous_month p;
```

**Business Use Cases:**
- Monthly financial reporting
- Year-over-year growth analysis
- Service mix analysis
- Customer acquisition tracking

---

### 1.3 Revenue by Payment Method

**View:** `revenue_by_payment_method`

**Purpose:** Analyze payment channel preferences and processing metrics.

**Metrics:**

| Metric | Definition | Calculation |
|--------|------------|-------------|
| `report_date` | Transaction date | `DATE(payments.created_at)` |
| `payment_method` | Payment channel used | credit_card, cash, bank_transfer, etc. |
| `transaction_count` | Number of transactions | `COUNT(DISTINCT payments.id)` |
| `total_amount` | Total processed amount | `SUM(payments.amount)` |
| `avg_transaction_value` | Average payment size | `AVG(payments.amount)` |
| `min_transaction` | Smallest transaction | `MIN(payments.amount)` |
| `max_transaction` | Largest transaction | `MAX(payments.amount)` |

**Usage Example:**

```sql
-- Payment method distribution last 7 days
SELECT
  payment_method,
  SUM(transaction_count) as total_transactions,
  SUM(total_amount) as total_processed,
  ROUND(SUM(total_amount) / SUM(SUM(total_amount)) OVER () * 100, 2) as pct_of_total
FROM revenue_by_payment_method
WHERE report_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY payment_method
ORDER BY total_processed DESC;
```

**Business Use Cases:**
- Payment processor optimization
- Cash flow management
- Transaction fee analysis
- Fraud detection patterns

---

## 2. Conversion Tracking

### 2.1 Chat to Booking Conversion

**View:** `chat_booking_conversion`

**Purpose:** Measure the effectiveness of the chat-based booking flow and identify conversion bottlenecks.

**Metrics:**

| Metric | Definition | Calculation |
|--------|------------|-------------|
| `report_date` | Activity date | `DATE(customer_activity_log.timestamp)` |
| `total_active_users` | Users with any activity | `COUNT(DISTINCT customer_id)` |
| `bookings_completed` | Users who created bookings | `COUNT WHERE activity_type = 'booking_created'` |
| `bookings_paid` | Users who completed payment | `COUNT WHERE activity_type = 'payment_received'` |
| `booking_rate` | Chat to booking conversion % | `(bookings_completed / total_active_users) * 100` |
| `payment_rate` | Booking to payment conversion % | `(bookings_paid / total_active_users) * 100` |

**Key Performance Indicators:**

- **Target Booking Rate:** 25-35%
- **Target Payment Rate:** 20-30%
- **Excellent Performance:** >40% booking rate
- **Needs Improvement:** <15% booking rate

**Usage Example:**

```sql
-- Identify conversion drop-off days
SELECT
  report_date,
  booking_rate,
  payment_rate,
  booking_rate - payment_rate as drop_off_rate
FROM chat_booking_conversion
WHERE report_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY drop_off_rate DESC
LIMIT 10;
```

**Business Use Cases:**
- Chat UI/UX optimization
- Identify friction points in booking flow
- A/B testing effectiveness
- Customer support staffing decisions

---

### 2.2 Customer Conversion Funnel

**View:** `customer_conversion_funnel`

**Purpose:** Track customer lifecycle progression from signup to repeat purchase.

**Metrics:**

| Metric | Definition | Calculation |
|--------|------------|-------------|
| `report_week` | Week start date | `DATE_TRUNC('week', customers.created_at)` |
| `total_customers` | New customer signups | `COUNT(DISTINCT customers.id)` |
| `customers_with_bookings` | Customers who booked | `COUNT(DISTINCT bookings.customer_id)` |
| `paying_customers` | Customers who paid | `COUNT WHERE payment_status = 'paid'` |
| `repeat_customers` | Customers with >1 booking | `COUNT WHERE total_bookings > 1` |
| `customer_booking_rate` | % of customers who book | `(customers_with_bookings / total_customers) * 100` |
| `customer_conversion_rate` | % of customers who pay | `(paying_customers / total_customers) * 100` |

**Funnel Stages:**

1. **Registration** → 100% (baseline)
2. **First Booking** → Target 40-50%
3. **Payment Complete** → Target 35-45%
4. **Repeat Purchase** → Target 15-25%

**Usage Example:**

```sql
-- Weekly cohort analysis
SELECT
  report_week,
  total_customers,
  customer_conversion_rate,
  ROUND(repeat_customers::numeric / NULLIF(paying_customers, 0) * 100, 2) as repeat_rate
FROM customer_conversion_funnel
WHERE report_week >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '12 weeks')
ORDER BY report_week DESC;
```

**Business Use Cases:**
- Customer acquisition effectiveness
- Retention strategy optimization
- Lifetime value prediction
- Marketing ROI measurement

---

## 3. Airport Performance

### 3.1 Airport Performance Metrics

**View:** `airport_performance_metrics`

**Purpose:** Monitor operational efficiency and profitability by airport location.

**Metrics:**

| Metric | Definition | Calculation |
|--------|------------|-------------|
| `airport_name` | Pickup location identifier | `bookings.pickup_address` |
| `total_transfers` | All airport bookings | `COUNT(DISTINCT bookings.id)` |
| `completed_transfers` | Successfully completed trips | `COUNT WHERE status = 'completed'` |
| `cancelled_transfers` | Cancelled transfers | `COUNT WHERE status = 'cancelled'` |
| `total_revenue` | Airport-specific revenue | `SUM(price) WHERE payment_status = 'paid'` |
| `avg_transfer_price` | Average fare per transfer | `AVG(price) WHERE payment_status = 'paid'` |
| `completion_rate` | % of transfers completed | `(completed / total) * 100` |
| `avg_delay_minutes` | Average pickup delay | `AVG(arrived_time - scheduled_time)` in minutes |
| `active_drivers` | Drivers serving airport | `COUNT(DISTINCT driver_id)` |

**Performance Benchmarks:**

- **Excellent Completion Rate:** >95%
- **Good Completion Rate:** 90-95%
- **Needs Improvement:** <90%
- **Target Delay:** <5 minutes average
- **Acceptable Delay:** 5-10 minutes
- **Poor Service:** >15 minutes

**Usage Example:**

```sql
-- Identify top-performing and underperforming airports
SELECT
  airport_name,
  total_transfers,
  total_revenue,
  completion_rate,
  avg_delay_minutes,
  CASE
    WHEN completion_rate >= 95 AND avg_delay_minutes <= 5 THEN 'Excellent'
    WHEN completion_rate >= 90 AND avg_delay_minutes <= 10 THEN 'Good'
    ELSE 'Needs Improvement'
  END as performance_tier
FROM airport_performance_metrics
ORDER BY total_revenue DESC;
```

**Business Use Cases:**
- Resource allocation by airport
- Driver shift scheduling
- Price optimization per location
- Service quality monitoring

---

### 3.2 Airport Daily Operations

**View:** `airport_daily_operations`

**Purpose:** Real-time operational dashboard for daily airport transfer management.

**Metrics:**

| Metric | Definition | Calculation |
|--------|------------|-------------|
| `operation_date` | Service date | `DATE(bookings.pickup_datetime)` |
| `airport_name` | Airport location | `bookings.pickup_address` |
| `scheduled_transfers` | Total scheduled pickups | `COUNT(DISTINCT bookings.id)` |
| `completed_transfers` | Finished trips | `COUNT WHERE status = 'completed'` |
| `in_progress_transfers` | Currently active | `COUNT WHERE status IN ('en_route', 'in_progress')` |
| `pending_transfers` | Awaiting dispatch | `COUNT WHERE status = 'assigned'` |
| `drivers_deployed` | Active drivers on duty | `COUNT(DISTINCT driver_id)` |
| `daily_revenue` | Date-specific revenue | `SUM(price) WHERE payment_status = 'paid'` |
| `avg_delay_minutes` | Daily average delay | `AVG(arrived_time - scheduled_time)` |

**Usage Example:**

```sql
-- Today's operations dashboard
SELECT
  airport_name,
  scheduled_transfers,
  completed_transfers,
  in_progress_transfers,
  pending_transfers,
  drivers_deployed,
  ROUND(completed_transfers::numeric / NULLIF(scheduled_transfers, 0) * 100, 2) as completion_pct,
  avg_delay_minutes
FROM airport_daily_operations
WHERE operation_date = CURRENT_DATE
ORDER BY pending_transfers DESC;
```

**Business Use Cases:**
- Live dispatch monitoring
- Real-time driver allocation
- Service level agreement tracking
- Emergency response coordination

---

## 4. Partner Performance

### 4.1 Partner Performance Summary

**View:** `partner_performance_summary`

**Purpose:** Comprehensive partner business metrics for relationship management.

**Metrics:**

| Metric | Definition | Calculation |
|--------|------------|-------------|
| `partner_id` | Unique partner identifier | UUID |
| `business_name` | Partner business name | Text |
| `partner_type` | Partner category | hotel, transport, activity, etc. |
| `partner_status` | Account status | active, suspended, inactive |
| `total_orders` | All partner orders | `COUNT(DISTINCT orders.id)` |
| `completed_orders` | Successfully fulfilled | `COUNT WHERE status = 'completed'` |
| `cancelled_orders` | Cancelled orders | `COUNT WHERE status = 'cancelled'` |
| `total_revenue` | Gross revenue generated | `SUM(total_price) WHERE payment_status = 'completed'` |
| `total_commissions_earned` | Partner earnings | `SUM(net_amount) WHERE status = 'approved'` |
| `total_payouts_received` | Paid out to partner | `SUM(amount) WHERE payout_status = 'paid'` |
| `completion_rate` | Order fulfillment % | `(completed / total) * 100` |
| `cancellation_rate` | Cancellation % | `(cancelled / total) * 100` |

**Partner Tier Classification:**

- **Platinum:** >100 orders/month, >98% completion, >$10K revenue
- **Gold:** >50 orders/month, >95% completion, >$5K revenue
- **Silver:** >20 orders/month, >90% completion, >$2K revenue
- **Bronze:** <20 orders/month or <90% completion

**Usage Example:**

```sql
-- Partner tier segmentation
SELECT
  business_name,
  total_orders,
  total_revenue,
  completion_rate,
  CASE
    WHEN total_orders > 100 AND completion_rate > 98 AND total_revenue > 10000 THEN 'Platinum'
    WHEN total_orders > 50 AND completion_rate > 95 AND total_revenue > 5000 THEN 'Gold'
    WHEN total_orders > 20 AND completion_rate > 90 AND total_revenue > 2000 THEN 'Silver'
    ELSE 'Bronze'
  END as partner_tier
FROM partner_performance_summary
WHERE partner_status = 'active'
ORDER BY total_revenue DESC;
```

**Business Use Cases:**
- Partner relationship management
- Commission negotiations
- Partner onboarding prioritization
- Risk assessment and monitoring

---

### 4.2 Partner Monthly Stats

**View:** `partner_monthly_stats`

**Purpose:** Track monthly partner performance trends and payout cycles.

**Metrics:**

| Metric | Definition | Calculation |
|--------|------------|-------------|
| `report_month` | Calendar month | `DATE_TRUNC('month', orders.created_at)` |
| `partner_id` | Partner identifier | UUID |
| `business_name` | Partner name | Text |
| `partner_type` | Business category | Type classification |
| `monthly_orders` | Orders in month | `COUNT(DISTINCT orders.id)` |
| `completed_orders` | Successfully fulfilled | `COUNT WHERE status = 'completed'` |
| `monthly_revenue` | Month revenue | `SUM(total_price) WHERE payment_status = 'completed'` |
| `monthly_commission` | Partner earnings | `SUM(net_amount) WHERE status = 'approved'` |

**Usage Example:**

```sql
-- Partner growth trajectory
SELECT
  partner_id,
  business_name,
  report_month,
  monthly_revenue,
  monthly_commission,
  LAG(monthly_revenue) OVER (PARTITION BY partner_id ORDER BY report_month) as prev_month_revenue,
  ROUND(
    (monthly_revenue - LAG(monthly_revenue) OVER (PARTITION BY partner_id ORDER BY report_month))
    / NULLIF(LAG(monthly_revenue) OVER (PARTITION BY partner_id ORDER BY report_month), 0) * 100,
    2
  ) as revenue_growth_pct
FROM partner_monthly_stats
WHERE report_month >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
ORDER BY partner_id, report_month DESC;
```

**Business Use Cases:**
- Monthly partner statements
- Commission payout processing
- Partner performance reviews
- Revenue forecasting

---

## 5. Driver Performance

### 5.1 Driver Performance Summary

**View:** `driver_performance_summary`

**Purpose:** Comprehensive driver performance analytics for fleet management.

**Metrics:**

| Metric | Definition | Calculation |
|--------|------------|-------------|
| `driver_id` | Unique driver identifier | UUID |
| `driver_name` | Driver full name | first_name + last_name |
| `driver_status` | Current status | active, on_break, off_duty, suspended |
| `vehicle_info` | Assigned vehicle | make + model |
| `vehicle_capacity` | Vehicle passenger capacity | Integer |
| `total_assignments` | All trip assignments | `COUNT(DISTINCT trip_assignments.id)` |
| `completed_trips` | Successfully finished | `COUNT WHERE status = 'completed'` |
| `cancelled_trips` | Cancelled assignments | `COUNT WHERE status = 'cancelled'` |
| `avg_rating` | Customer satisfaction | Average rating (0-5 scale) |
| `total_trips` | Lifetime trip count | Integer |
| `avg_delay_minutes` | Average lateness | `AVG(arrived - scheduled)` in minutes |
| `completion_rate` | Trip completion % | `(completed / total) * 100` |
| `last_trip_date` | Most recent trip | Timestamp |

**Driver Performance Tiers:**

- **Top Performer:** >95% completion, >4.5 rating, <3 min avg delay
- **Good Driver:** >90% completion, >4.0 rating, <5 min avg delay
- **Needs Training:** <85% completion, <3.5 rating, or >10 min avg delay
- **At Risk:** <80% completion or <3.0 rating

**Usage Example:**

```sql
-- Identify drivers needing recognition or training
SELECT
  driver_name,
  total_assignments,
  completion_rate,
  avg_rating,
  avg_delay_minutes,
  CASE
    WHEN completion_rate > 95 AND avg_rating > 4.5 AND avg_delay_minutes < 3 THEN 'Top Performer - Bonus Eligible'
    WHEN completion_rate > 90 AND avg_rating > 4.0 AND avg_delay_minutes < 5 THEN 'Good Driver'
    WHEN completion_rate < 85 OR avg_rating < 3.5 OR avg_delay_minutes > 10 THEN 'Needs Training'
    WHEN completion_rate < 80 OR avg_rating < 3.0 THEN 'At Risk - Review Required'
    ELSE 'Standard Performance'
  END as performance_status
FROM driver_performance_summary
WHERE driver_status = 'active'
ORDER BY completion_rate DESC, avg_rating DESC;
```

**Business Use Cases:**
- Driver incentive programs
- Performance improvement plans
- Fleet optimization
- Customer service quality control

---

### 5.2 Driver Daily Stats

**View:** `driver_daily_stats`

**Purpose:** Daily driver activity and productivity tracking.

**Metrics:**

| Metric | Definition | Calculation |
|--------|------------|-------------|
| `report_date` | Service date | `DATE(trip_assignments.assigned_at)` |
| `driver_id` | Driver identifier | UUID |
| `driver_name` | Driver full name | first_name + last_name |
| `daily_assignments` | Trips assigned | `COUNT(DISTINCT trip_assignments.id)` |
| `completed_trips` | Finished trips | `COUNT WHERE status = 'completed'` |
| `avg_delay_minutes` | Average pickup delay | `AVG(arrived - scheduled)` |
| `first_pickup_time` | First trip start | Timestamp |
| `last_dropoff_time` | Last trip end | Timestamp |
| `hours_active` | Total working hours | `(last_dropoff - first_pickup)` in hours |

**Usage Example:**

```sql
-- Today's driver leaderboard
SELECT
  driver_name,
  daily_assignments,
  completed_trips,
  hours_active,
  ROUND(completed_trips::numeric / NULLIF(hours_active, 0), 2) as trips_per_hour,
  avg_delay_minutes
FROM driver_daily_stats
WHERE report_date = CURRENT_DATE
ORDER BY completed_trips DESC
LIMIT 20;
```

**Business Use Cases:**
- Daily performance tracking
- Shift scheduling optimization
- Driver workload balancing
- Overtime management

---

## 6. Executive Dashboard

### 6.1 Executive Dashboard Metrics

**View:** `executive_dashboard_metrics`

**Purpose:** High-level business KPIs for executive decision-making.

**Metrics:**

| Metric | Definition | Calculation |
|--------|------------|-------------|
| `report_month` | Calendar month | `DATE_TRUNC('month', bookings.created_at)` |
| `total_revenue` | Gross revenue | `SUM(price) WHERE payment_status = 'paid'` |
| `avg_booking_value` | Average order value | `AVG(price) WHERE payment_status = 'paid'` |
| `total_bookings` | Booking volume | `COUNT(DISTINCT bookings.id)` |
| `paid_bookings` | Payment conversions | `COUNT WHERE payment_status = 'paid'` |
| `unique_customers` | Active customer base | `COUNT(DISTINCT customer_id)` |
| `active_drivers` | Driver fleet size | `COUNT(DISTINCT driver_id)` |
| `active_partners` | Partner network size | `COUNT(DISTINCT partner_id)` |
| `completed_bookings` | Service fulfillment | `COUNT WHERE status = 'completed'` |
| `cancelled_bookings` | Cancellations | `COUNT WHERE status = 'cancelled'` |
| `payment_conversion_rate` | Payment success % | `(paid / total) * 100` |
| `completion_rate` | Service fulfillment % | `(completed / total) * 100` |
| `total_commissions_paid` | Partner payouts | `SUM(net_amount) WHERE status = 'approved'` |
| `net_platform_revenue` | Platform profit | `revenue - commissions` |

**Key Performance Indicators:**

| KPI | Target | Good | Needs Improvement |
|-----|--------|------|-------------------|
| Payment Conversion | >85% | 75-85% | <75% |
| Completion Rate | >95% | 90-95% | <90% |
| Revenue Growth MoM | >10% | 5-10% | <5% |
| Customer Growth MoM | >15% | 10-15% | <10% |

**Usage Example:**

```sql
-- Executive monthly scorecard
WITH current AS (
  SELECT * FROM executive_dashboard_metrics
  WHERE report_month = DATE_TRUNC('month', CURRENT_DATE)
),
previous AS (
  SELECT * FROM executive_dashboard_metrics
  WHERE report_month = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
)
SELECT
  c.total_revenue,
  ROUND((c.total_revenue - p.total_revenue) / p.total_revenue * 100, 2) as revenue_growth_pct,
  c.unique_customers,
  ROUND((c.unique_customers - p.unique_customers)::numeric / p.unique_customers * 100, 2) as customer_growth_pct,
  c.payment_conversion_rate,
  c.completion_rate,
  c.net_platform_revenue,
  ROUND(c.net_platform_revenue / c.total_revenue * 100, 2) as profit_margin_pct
FROM current c, previous p;
```

**Business Use Cases:**
- Board reporting
- Strategic planning
- Investor relations
- Business health monitoring

---

### 6.2 Service Type Performance

**View:** `service_type_performance`

**Purpose:** Compare performance across different service categories.

**Metrics:**

| Metric | Definition | Calculation |
|--------|------------|-------------|
| `booking_type` | Service category | airport_transfer, hotel, flight, car_rental, tour |
| `total_bookings` | Booking volume | `COUNT(DISTINCT bookings.id)` |
| `paid_bookings` | Paid conversions | `COUNT WHERE payment_status = 'paid'` |
| `total_revenue` | Revenue by service | `SUM(price) WHERE payment_status = 'paid'` |
| `avg_booking_value` | Average transaction | `AVG(price) WHERE payment_status = 'paid'` |
| `unique_customers` | Customers per service | `COUNT(DISTINCT customer_id)` |
| `conversion_rate` | Payment success % | `(paid / total) * 100` |

**Usage Example:**

```sql
-- Service category portfolio analysis
SELECT
  booking_type,
  total_bookings,
  total_revenue,
  ROUND(total_revenue / SUM(total_revenue) OVER () * 100, 2) as revenue_share_pct,
  avg_booking_value,
  conversion_rate,
  unique_customers
FROM service_type_performance
ORDER BY total_revenue DESC;
```

**Business Use Cases:**
- Product portfolio optimization
- Marketing budget allocation
- Inventory planning
- Service expansion decisions

---

## Query Best Practices

### Performance Optimization

1. **Always filter by date ranges:**
```sql
WHERE report_date >= CURRENT_DATE - INTERVAL '30 days'
```

2. **Use appropriate indexes:**
- Views leverage existing table indexes
- Additional filtering on indexed columns improves performance

3. **Limit result sets:**
```sql
LIMIT 100  -- For exploratory queries
```

### Aggregation Tips

1. **Window functions for trends:**
```sql
SELECT
  report_date,
  total_revenue,
  AVG(total_revenue) OVER (ORDER BY report_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as rolling_7day_avg
FROM daily_revenue_summary;
```

2. **Cohort analysis:**
```sql
SELECT
  DATE_TRUNC('month', created_at) as cohort_month,
  COUNT(*) as customers,
  SUM(total_spent) as ltv
FROM customers
GROUP BY cohort_month;
```

---

## Data Refresh Frequency

All views are **real-time** and reflect the current state of the database:

- Revenue metrics: Updated immediately on payment
- Conversion rates: Updated on booking creation/payment
- Performance metrics: Updated on trip status changes
- Driver/Partner stats: Updated on assignment completion

No scheduled refresh needed - query anytime for current data.

---

## Security & Access Control

All views have RLS (Row Level Security) enabled with authenticated user access:

```sql
GRANT SELECT ON [view_name] TO authenticated;
```

**Access Levels:**
- **Admins:** Full access to all views
- **Agents:** Access to operational views (airport, driver, bookings)
- **Partners:** Access to their own performance data (filtered by partner_id)
- **Drivers:** Access to their own stats (filtered by driver_id)

---

## Support & Maintenance

**View Updates:**
Views can be modified using `CREATE OR REPLACE VIEW` without data loss.

**Adding Custom Metrics:**
Create new views based on existing tables following the naming convention:
- `[category]_[metric_type]_[aggregation]`
- Example: `customer_lifetime_value_summary`

**Troubleshooting:**
- Slow queries: Add appropriate indexes on underlying tables
- Incorrect data: Verify source table data integrity
- Missing data: Check RLS policies and user permissions

---

## Changelog

**2024-12-14:** Initial analytics dashboard release
- 13 views covering revenue, conversions, operations, and performance
- Full documentation with metric definitions and use cases
