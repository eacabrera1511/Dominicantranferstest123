# CRM Automation System

## Overview

This document details all automated workflows in the CRM, including trigger events, edge function responsibilities, and database updates for each automation.

---

## 1. New Booking Notification Automation

### Trigger Event
- **Database Event**: INSERT on `bookings` table
- **Status Condition**: Any new booking creation
- **Timing**: Immediate (real-time trigger)

### Edge Function: `handle-new-booking`

**Responsibilities:**
1. Send confirmation email to customer with booking details
2. Send notification to admin dashboard
3. Create customer record if first-time booking
4. Log customer activity
5. If payment method is "later", send payment reminder
6. Update customer lifetime stats

**Request Payload:**
```json
{
  "booking_id": "uuid",
  "customer_email": "customer@example.com",
  "customer_name": "John Doe",
  "service_type": "airport_transfer",
  "pickup_datetime": "2024-12-20T14:30:00Z",
  "price": 150.00
}
```

**Database Updates:**
```sql
-- Create or update customer record
INSERT INTO customers (email, first_name, last_name, phone)
VALUES (?, ?, ?, ?)
ON CONFLICT (email) DO UPDATE
SET total_bookings = customers.total_bookings + 1,
    last_booking_date = NOW();

-- Link booking to customer
UPDATE bookings
SET customer_id = (SELECT id FROM customers WHERE email = ?)
WHERE id = ?;

-- Log activity
INSERT INTO customer_activity_log (customer_id, activity_type, details)
VALUES (?, 'booking_created', jsonb_build_object('booking_id', ?));

-- Create notification
INSERT INTO admin_notifications (type, message, data, priority)
VALUES ('new_booking', 'New booking received', jsonb_build_object('booking_id', ?), 'normal');
```

**Email Template (Customer):**
```html
Subject: Booking Confirmation - [Service Type]

Hi [Customer Name],

Thank you for your booking! Here are your details:

Service: [Service Type]
Date & Time: [Pickup DateTime]
Pickup: [Pickup Address]
Dropoff: [Dropoff Address]
Passengers: [Count]
Price: $[Amount]

Booking Reference: [Booking ID]

We'll send you driver details closer to your pickup time.

Need help? Reply to this email or call us at [Phone].

Best regards,
[Company Name]
```

---

## 2. Payment Confirmation Automation

### Trigger Event
- **Database Event**: UPDATE on `bookings` table
- **Status Condition**: `payment_status` changes from 'pending' to 'paid'
- **Timing**: Immediate

### Edge Function: `handle-payment-confirmation`

**Responsibilities:**
1. Send payment receipt to customer
2. Update booking workflow status to 'awaiting_assignment'
3. Trigger auto-dispatch if pickup time is within 24 hours
4. Update partner commission tracking
5. Record transaction in financial logs
6. Send payment confirmation to admin

**Request Payload:**
```json
{
  "booking_id": "uuid",
  "payment_method": "stripe",
  "amount_paid": 150.00,
  "stripe_payment_id": "pi_123456",
  "customer_id": "uuid"
}
```

**Database Updates:**
```sql
-- Update booking status
UPDATE bookings
SET
  payment_status = 'paid',
  workflow_status = 'awaiting_assignment',
  updated_at = NOW()
WHERE id = ?;

-- Create payment record
INSERT INTO payment_transactions (
  booking_id,
  customer_id,
  amount,
  payment_method,
  stripe_payment_id,
  status,
  transaction_date
)
VALUES (?, ?, ?, ?, ?, 'completed', NOW());

-- Update customer lifetime value
UPDATE customers
SET
  total_spent = total_spent + ?,
  updated_at = NOW()
WHERE id = ?;

-- Log activity
INSERT INTO customer_activity_log (customer_id, activity_type, details)
VALUES (?, 'payment_received', jsonb_build_object(
  'booking_id', ?,
  'amount', ?,
  'method', ?
));

-- If partner booking, track commission
INSERT INTO partner_transactions (
  partner_id,
  booking_id,
  transaction_type,
  amount,
  status
)
SELECT
  partner_id,
  ?,
  'commission_pending',
  ? * commission_rate / 100,
  'pending'
FROM partners
WHERE id = (SELECT partner_id FROM bookings WHERE id = ?)
  AND partner_id IS NOT NULL;
```

**Auto-Dispatch Trigger:**
```typescript
// If pickup is within 24 hours, trigger auto-dispatch
const pickupTime = new Date(booking.pickup_datetime);
const now = new Date();
const hoursUntilPickup = (pickupTime.getTime() - now.getTime()) / (1000 * 60 * 60);

if (hoursUntilPickup <= 24 && hoursUntilPickup > 0) {
  // Call auto-dispatch function
  await fetch(`${supabaseUrl}/functions/v1/auto-dispatch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ booking_id: booking.id })
  });
}
```

**Email Template (Payment Receipt):**
```html
Subject: Payment Receipt - Booking #[ID]

Hi [Customer Name],

Thank you for your payment!

Payment Details:
Amount Paid: $[Amount]
Payment Method: [Method]
Transaction ID: [Transaction ID]
Date: [Date]

Booking Details:
Service: [Service Type]
Date: [Pickup DateTime]
Reference: [Booking ID]

Your booking is confirmed and we're assigning a driver.

Download Receipt: [Link]

Best regards,
[Company Name]
```

---

## 3. No-Show Handling Automation

### Trigger Event
- **Scheduled Event**: Cron job runs every 15 minutes
- **Status Condition**: Bookings where:
  - `workflow_status` = 'assigned' or 'confirmed'
  - `pickup_datetime` < NOW() - 30 minutes
  - No driver status update (no 'arrived' or 'in_progress')
- **Timing**: 30 minutes after scheduled pickup time

### Edge Function: `handle-no-shows`

**Responsibilities:**
1. Identify potential no-show bookings
2. Mark booking as 'no_show'
3. Notify admin for manual verification
4. Apply no-show fee if applicable
5. Update customer record with no-show count
6. Release driver assignment
7. Send notification to customer

**Query Logic:**
```sql
SELECT b.*, ta.status as assignment_status
FROM bookings b
LEFT JOIN trip_assignments ta ON b.id = ta.booking_id
WHERE b.workflow_status IN ('assigned', 'confirmed', 'driver_en_route')
  AND b.pickup_datetime < NOW() - INTERVAL '30 minutes'
  AND (ta.status IS NULL OR ta.status NOT IN ('arrived', 'in_progress', 'completed'))
  AND b.payment_status = 'paid'
  AND b.workflow_status != 'no_show'
  AND b.workflow_status != 'cancelled';
```

**Database Updates:**
```sql
-- Mark booking as no-show
UPDATE bookings
SET
  workflow_status = 'no_show',
  updated_at = NOW()
WHERE id = ?;

-- Cancel active assignment
UPDATE trip_assignments
SET
  status = 'cancelled',
  cancelled_at = NOW(),
  cancellation_reason = 'Customer no-show'
WHERE booking_id = ?
  AND status IN ('assigned', 'accepted', 'en_route_pickup');

-- Release vehicle
UPDATE vehicles
SET status = 'available'
WHERE id = (SELECT vehicle_id FROM trip_assignments WHERE booking_id = ?);

-- Update customer record
UPDATE customers
SET
  no_show_count = no_show_count + 1,
  updated_at = NOW()
WHERE id = (SELECT customer_id FROM bookings WHERE id = ?);

-- Log activity
INSERT INTO customer_activity_log (customer_id, activity_type, details)
VALUES (
  (SELECT customer_id FROM bookings WHERE id = ?),
  'no_show',
  jsonb_build_object('booking_id', ?, 'pickup_time', ?)
);

-- Create admin alert
INSERT INTO admin_notifications (type, message, data, priority)
VALUES (
  'no_show_detected',
  'Customer no-show detected',
  jsonb_build_object('booking_id', ?, 'customer_id', ?),
  'high'
);

-- Apply no-show fee (if policy exists)
INSERT INTO payment_transactions (
  booking_id,
  customer_id,
  amount,
  payment_method,
  transaction_type,
  status
)
VALUES (?, ?, -50.00, 'penalty', 'no_show_fee', 'pending');
```

**Email Template (No-Show Notice):**
```html
Subject: Missed Pickup - Booking #[ID]

Hi [Customer Name],

We noticed you weren't available for your scheduled pickup:

Scheduled Time: [Pickup DateTime]
Location: [Pickup Address]
Driver: [Driver Name]

If this was a mistake or emergency, please contact us immediately at [Phone].

No-Show Policy:
A no-show fee of $50 has been applied. This will be charged to your payment method or deducted from future bookings.

To avoid this in the future, please cancel at least 2 hours before pickup time.

Best regards,
[Company Name]
```

---

## 4. Booking Completion Automation

### Trigger Event
- **Database Event**: UPDATE on `trip_assignments` table
- **Status Condition**: `status` changes to 'completed'
- **Timing**: Immediate

### Edge Function: `handle-booking-completion`

**Responsibilities:**
1. Generate invoice
2. Send completion email to customer with trip summary
3. Request customer rating/review
4. Calculate partner commission
5. Update driver statistics
6. Process partner payout tracking
7. Release resources (driver, vehicle)

**Request Payload:**
```json
{
  "assignment_id": "uuid",
  "booking_id": "uuid",
  "driver_id": "uuid",
  "dropoff_completed_at": "2024-12-20T16:30:00Z",
  "actual_price": 150.00
}
```

**Database Updates:**
```sql
-- Update booking final status
UPDATE bookings
SET
  workflow_status = 'completed',
  updated_at = NOW()
WHERE id = ?;

-- Generate invoice
INSERT INTO invoices (
  booking_id,
  customer_id,
  assignment_id,
  invoice_date,
  due_date,
  subtotal,
  tax_rate,
  tax_amount,
  total_amount,
  status,
  line_items
)
SELECT
  b.id,
  b.customer_id,
  ta.id,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  b.price,
  0.15,
  b.price * 0.15,
  b.price * 1.15,
  'sent',
  jsonb_build_array(
    jsonb_build_object(
      'description', b.service_type,
      'quantity', 1,
      'unit_price', b.price,
      'total', b.price
    )
  )
FROM bookings b
JOIN trip_assignments ta ON b.id = ta.booking_id
WHERE b.id = ?;

-- Update customer stats
UPDATE customers
SET
  total_bookings = total_bookings + 1,
  total_spent = total_spent + ?,
  last_booking_date = CURRENT_DATE,
  updated_at = NOW()
WHERE id = (SELECT customer_id FROM bookings WHERE id = ?);

-- Update driver stats (already handled by trigger)
-- Update vehicle mileage estimate
UPDATE vehicles
SET
  mileage = mileage + 50,
  updated_at = NOW()
WHERE id = (SELECT vehicle_id FROM trip_assignments WHERE id = ?);

-- Create review request
INSERT INTO review_requests (
  booking_id,
  customer_id,
  driver_id,
  status,
  expires_at
)
VALUES (?, ?, ?, 'pending', NOW() + INTERVAL '7 days');

-- Calculate partner commission if applicable
UPDATE partner_transactions
SET
  status = 'approved',
  approved_at = NOW()
WHERE booking_id = ?
  AND transaction_type = 'commission_pending';

-- Log completion
INSERT INTO customer_activity_log (customer_id, activity_type, details)
VALUES (
  (SELECT customer_id FROM bookings WHERE id = ?),
  'trip_completed',
  jsonb_build_object(
    'booking_id', ?,
    'driver_id', ?,
    'completion_time', ?
  )
);
```

**Email Template (Completion & Review Request):**
```html
Subject: Trip Completed - Thank You!

Hi [Customer Name],

Your trip has been completed successfully!

Trip Summary:
Driver: [Driver Name]
Pickup: [Pickup Address]
Dropoff: [Dropoff Address]
Pickup Time: [Time]
Dropoff Time: [Time]
Total: $[Amount]

Invoice: [Download Link]

How was your experience?
We'd love to hear your feedback!

[Rate Your Trip Button]
⭐⭐⭐⭐⭐

Your feedback helps us improve our service and helps other customers.

Book Again: [Link to Website]

Thank you for choosing [Company Name]!

Best regards,
[Company Name] Team
```

---

## 5. Partner Commission Calculation Automation

### Trigger Event
- **Scheduled Event**: Runs daily at midnight (cron: `0 0 * * *`)
- **Status Condition**: All completed trips from previous day with partner associations
- **Timing**: Daily batch process

### Edge Function: `calculate-partner-commissions`

**Responsibilities:**
1. Identify all completed bookings with partner associations
2. Calculate commission based on partner agreement
3. Create commission records
4. Generate partner payout report
5. Send commission summary to partners
6. Update partner lifetime earnings

**Query Logic:**
```sql
-- Get all completed trips from yesterday with partner associations
SELECT
  b.id as booking_id,
  b.price,
  b.customer_id,
  p.id as partner_id,
  p.commission_rate,
  p.payment_terms,
  ta.id as assignment_id
FROM bookings b
JOIN partners p ON b.partner_id = p.id
JOIN trip_assignments ta ON b.id = ta.booking_id
WHERE ta.status = 'completed'
  AND DATE(ta.dropoff_completed_at) = CURRENT_DATE - INTERVAL '1 day'
  AND NOT EXISTS (
    SELECT 1 FROM partner_transactions pt
    WHERE pt.booking_id = b.id
      AND pt.transaction_type = 'commission_approved'
  );
```

**Commission Calculation Logic:**
```typescript
interface CommissionCalculation {
  bookingId: string;
  partnerId: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  platformFee: number;
}

function calculateCommission(
  bookingPrice: number,
  commissionRate: number
): CommissionCalculation {
  const commissionAmount = bookingPrice * (commissionRate / 100);
  const platformFee = bookingPrice * 0.03; // 3% platform fee
  const netAmount = commissionAmount - platformFee;

  return {
    grossAmount: bookingPrice,
    commissionRate,
    commissionAmount,
    platformFee,
    netAmount,
  };
}
```

**Database Updates:**
```sql
-- Create approved commission transaction
INSERT INTO partner_transactions (
  partner_id,
  booking_id,
  transaction_type,
  amount,
  platform_fee,
  net_amount,
  status,
  transaction_date
)
VALUES (?, ?, 'commission_approved', ?, ?, ?, 'approved', CURRENT_DATE);

-- Update partner lifetime earnings
UPDATE partners
SET
  total_earnings = total_earnings + ?,
  pending_payout = pending_payout + ?,
  total_bookings = total_bookings + 1,
  updated_at = NOW()
WHERE id = ?;

-- Create payout batch if monthly threshold reached
INSERT INTO partner_payouts (
  partner_id,
  payout_date,
  amount,
  status,
  included_transactions
)
SELECT
  partner_id,
  CURRENT_DATE,
  SUM(net_amount),
  'pending',
  jsonb_agg(id)
FROM partner_transactions
WHERE partner_id = ?
  AND status = 'approved'
  AND payout_id IS NULL
GROUP BY partner_id
HAVING SUM(net_amount) >= 100.00; -- Minimum payout threshold

-- Update partner dashboard stats
INSERT INTO partner_daily_stats (
  partner_id,
  date,
  bookings_count,
  total_revenue,
  commission_earned,
  platform_fees
)
SELECT
  partner_id,
  CURRENT_DATE - INTERVAL '1 day',
  COUNT(*),
  SUM(amount),
  SUM(amount),
  SUM(platform_fee)
FROM partner_transactions
WHERE DATE(transaction_date) = CURRENT_DATE - INTERVAL '1 day'
  AND transaction_type = 'commission_approved'
GROUP BY partner_id;
```

**Email Template (Partner Commission Summary):**
```html
Subject: Daily Commission Report - [Date]

Hi [Partner Name],

Here's your commission summary for [Date]:

Completed Trips: [Count]
Gross Revenue: $[Amount]
Commission Rate: [Rate]%
Commission Earned: $[Commission]
Platform Fee (3%): $[Fee]
Net Earnings: $[Net]

Year-to-Date:
Total Earnings: $[YTD]
Total Trips: [Count]

Pending Payout: $[Pending]
Next Payout: [Date]

View Detailed Report: [Link to Partner Portal]

Transaction Details:
[Booking #1] - $[Amount] - Commission: $[Commission]
[Booking #2] - $[Amount] - Commission: $[Commission]
...

Questions? Contact your account manager.

Best regards,
[Company Name] Partner Team
```

---

## 6. Additional Automations

### 6.1 Booking Reminder (24 Hours Before)

**Trigger:** Cron job hourly, checks bookings 24 hours ahead

**Edge Function:** `send-booking-reminders`

```sql
SELECT * FROM bookings
WHERE workflow_status = 'confirmed'
  AND pickup_datetime BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours'
  AND reminder_sent_24h = false;
```

**Email:** "Your trip is tomorrow at [time]. Driver details coming soon."

### 6.2 Driver Assignment Reminder

**Trigger:** Cron job every 2 hours, checks unassigned bookings

**Edge Function:** `check-unassigned-bookings`

```sql
SELECT * FROM bookings
WHERE workflow_status = 'awaiting_assignment'
  AND pickup_datetime < NOW() + INTERVAL '12 hours'
  AND payment_status = 'paid';
```

**Action:** Alert admin dashboard, attempt auto-dispatch

### 6.3 Late Payment Follow-Up

**Trigger:** Cron job daily, checks unpaid bookings

**Edge Function:** `handle-late-payments`

```sql
SELECT * FROM bookings
WHERE payment_status = 'pending'
  AND created_at < NOW() - INTERVAL '24 hours'
  AND workflow_status != 'cancelled';
```

**Action:** Send payment reminder email, cancel booking after 48 hours

### 6.4 Customer Feedback Follow-Up

**Trigger:** 7 days after completion for customers who haven't reviewed

**Edge Function:** `request-pending-reviews`

```sql
SELECT * FROM review_requests
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '7 days'
  AND reminder_sent = false;
```

**Email:** "We'd still love your feedback on your recent trip!"

---

## 7. Database Schema for Automations

### New Tables Needed

```sql
-- Payment transactions tracking
CREATE TABLE payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id),
  customer_id uuid REFERENCES customers(id),
  amount numeric NOT NULL,
  payment_method text,
  stripe_payment_id text,
  transaction_type text DEFAULT 'booking_payment',
  status text DEFAULT 'completed',
  transaction_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Review requests
CREATE TABLE review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id),
  customer_id uuid REFERENCES customers(id),
  driver_id uuid REFERENCES drivers(id),
  status text DEFAULT 'pending',
  reminder_sent boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Admin notifications
CREATE TABLE admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  priority text DEFAULT 'normal',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Partner daily stats
CREATE TABLE partner_daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners(id),
  date date NOT NULL,
  bookings_count integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  commission_earned numeric DEFAULT 0,
  platform_fees numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(partner_id, date)
);

-- Partner payouts
CREATE TABLE partner_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners(id),
  payout_date date NOT NULL,
  amount numeric NOT NULL,
  status text DEFAULT 'pending',
  included_transactions jsonb DEFAULT '[]'::jsonb,
  stripe_payout_id text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Customer activity log
CREATE TABLE customer_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  activity_type text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now()
);
```

---

## 8. Automation Monitoring & Logging

### Automation Execution Log

```sql
CREATE TABLE automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_name text NOT NULL,
  trigger_type text NOT NULL,
  execution_status text NOT NULL,
  records_processed integer DEFAULT 0,
  errors_count integer DEFAULT 0,
  execution_time_ms integer,
  error_details jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
```

### Success Metrics

Track for each automation:
- Execution count
- Success rate
- Average processing time
- Error rate
- Records processed

---

## 9. Error Handling & Retry Logic

### Retry Strategy

1. **Immediate Automations**: Retry 3 times with exponential backoff
2. **Scheduled Automations**: Log failure, retry on next scheduled run
3. **Critical Automations** (payment, no-show): Alert admin immediately

### Dead Letter Queue

Failed automations are logged to `automation_errors` table:

```sql
CREATE TABLE automation_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_name text NOT NULL,
  payload jsonb NOT NULL,
  error_message text,
  retry_count integer DEFAULT 0,
  status text DEFAULT 'failed',
  created_at timestamptz DEFAULT now(),
  last_retry_at timestamptz
);
```

---

## Summary Table

| Automation | Trigger | Frequency | Edge Function | Critical |
|------------|---------|-----------|---------------|----------|
| New Booking Notification | INSERT bookings | Real-time | `handle-new-booking` | Yes |
| Payment Confirmation | UPDATE bookings | Real-time | `handle-payment-confirmation` | Yes |
| No-Show Handling | Cron + Status Check | Every 15 min | `handle-no-shows` | Yes |
| Booking Completion | UPDATE trip_assignments | Real-time | `handle-booking-completion` | Yes |
| Partner Commissions | Cron | Daily 00:00 | `calculate-partner-commissions` | No |
| 24h Reminder | Cron | Hourly | `send-booking-reminders` | No |
| Unassigned Alert | Cron | Every 2h | `check-unassigned-bookings` | Yes |
| Late Payment | Cron | Daily | `handle-late-payments` | No |
| Review Follow-up | Cron | Daily | `request-pending-reviews` | No |

All automations include comprehensive logging, error handling, and admin notifications for critical failures.
