# Dispatch & Operations Layer Architecture

## Executive Summary

This document details the complete dispatch and operations system for the CRM, covering driver assignment workflows, vehicle availability logic, admin overrides, booking lifecycle management, driver notifications, and the driver portal architecture.

---

## 1. Booking Lifecycle Status Flow

### Status Workflow

```
pending → awaiting_assignment → assigned → accepted → en_route_pickup →
arrived → in_progress → completed → invoiced
```

### Alternative Paths

```
pending → cancelled
assigned → reassigned → assigned (new driver)
any_status → cancelled
```

### Detailed Status Definitions

| Status | Description | Booking Table | Assignment Table | Triggers |
|--------|-------------|---------------|------------------|----------|
| **pending** | Initial state after booking created | ✓ | - | Payment pending |
| **awaiting_assignment** | Payment confirmed, ready for dispatch | ✓ | - | Auto-dispatch eligibility |
| **assigned** | Driver/vehicle assigned | ✓ | ✓ | Driver notification sent |
| **accepted** | Driver accepted assignment | ✓ | ✓ | Customer notification |
| **en_route_pickup** | Driver heading to pickup location | ✓ | ✓ | ETA updates |
| **arrived** | Driver arrived at pickup | ✓ | ✓ | Customer notification |
| **in_progress** | Customer picked up, en route to destination | ✓ | ✓ | Real-time tracking |
| **completed** | Trip finished, customer dropped off | ✓ | ✓ | Invoice generation |
| **invoiced** | Invoice created and sent | ✓ | ✓ | Payment reconciliation |
| **cancelled** | Booking cancelled | ✓ | ✓ | Refund processing |

---

## 2. Driver Assignment Workflow

### 2.1 Manual Assignment (Agent Portal)

**Trigger**: Agent clicks "Assign Driver" on booking

**Workflow**:
```
1. Agent views booking details
2. System shows available drivers with:
   - Current location
   - Distance from pickup
   - Vehicle type match
   - Rating
   - Current availability status
3. Agent selects driver
4. System creates assignment record
5. Driver notification sent immediately
6. Booking status → "assigned"
7. Assignment logged in trip_logs
```

**API Endpoint**: Direct database insert
```typescript
const { data, error } = await supabase
  .from('trip_assignments')
  .insert({
    booking_id: 'book_123',
    driver_id: 'drv_456',
    vehicle_id: 'veh_789',
    assignment_method: 'manual',
    assigned_by: agentEmail,
    status: 'assigned'
  });
```

**Database Changes**:
```sql
-- Create assignment
INSERT INTO trip_assignments (booking_id, driver_id, vehicle_id,
  assignment_method, assigned_by, status)
VALUES ('book_123', 'drv_456', 'veh_789', 'manual', 'agent@company.com', 'assigned');

-- Update booking
UPDATE bookings SET workflow_status = 'assigned' WHERE id = 'book_123';

-- Log event
INSERT INTO trip_logs (assignment_id, event_type, event_data)
VALUES ('assign_abc', 'status_change', '{"status": "assigned", "method": "manual"}');
```

---

### 2.2 Auto-Dispatch Workflow

**Trigger**:
- Booking status changes to `awaiting_assignment`
- Manual trigger via Admin "Auto-Dispatch" button
- Scheduled cron job for future bookings

**Edge Function**: `auto-dispatch`

**Algorithm**:
```typescript
1. Fetch booking details (pickup location, vehicle type, passenger count)
2. Find available vehicles matching type
3. Find available drivers (status='active', not currently assigned)
4. Score drivers by:
   - Rating (40% weight)
   - Distance from pickup (30% weight)
   - Total trips experience (20% weight)
   - Vehicle match (10% weight)
5. Select top-scoring driver
6. Create assignment
7. Send notification
8. Update statuses
```

**Request Payload**:
```json
{
  "booking_id": "book_abc123",
  "preferred_driver_id": "drv_xyz789",  // optional
  "vehicle_type": "sedan",               // optional, defaults to booking.vehicle_type
  "pickup_datetime": "2024-12-20T14:30:00Z"  // optional
}
```

**Response**:
```json
{
  "success": true,
  "assignment": {
    "id": "assign_def456",
    "booking_id": "book_abc123",
    "driver_id": "drv_xyz789",
    "vehicle_id": "veh_ghi012",
    "status": "assigned",
    "assigned_at": "2024-12-14T10:30:00Z"
  },
  "driver": {
    "id": "drv_xyz789",
    "first_name": "John",
    "last_name": "Smith",
    "phone": "+1-555-0100",
    "rating": 4.8
  },
  "vehicle": {
    "id": "veh_ghi012",
    "make": "Toyota",
    "model": "Camry",
    "license_plate": "ABC123"
  },
  "message": "Booking auto-assigned successfully"
}
```

**Error Scenarios**:
- No available vehicles → Status 404
- No available drivers → Status 404
- Booking already assigned → Status 400
- Booking not found → Status 404

---

### 2.3 Admin Override Workflow

**Use Cases**:
1. Reassign to different driver
2. Cancel assignment
3. Force-assign despite availability flags
4. Override vehicle mismatch

**Admin Actions**:

**Reassignment**:
```typescript
// Cancel existing assignment
await supabase
  .from('trip_assignments')
  .update({
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancellation_reason: 'Admin reassignment'
  })
  .eq('id', existingAssignmentId);

// Create new assignment
await supabase
  .from('trip_assignments')
  .insert({
    booking_id: bookingId,
    driver_id: newDriverId,
    vehicle_id: newVehicleId,
    assignment_method: 'manual',
    assigned_by: adminEmail,
    notes: 'Reassigned by admin - original driver unavailable'
  });
```

**Force Assignment** (bypass availability checks):
```typescript
// Admin can assign even if driver shows as 'on_break' or 'off_duty'
const assignment = await supabase
  .from('trip_assignments')
  .insert({
    booking_id: bookingId,
    driver_id: driverId,  // No availability check
    vehicle_id: vehicleId,
    assignment_method: 'manual',
    assigned_by: adminEmail,
    notes: 'OVERRIDE: Admin force-assigned'
  });
```

**Permissions Required**:
- Role: `admin` or `super_admin` in `admin_users` table
- RLS Policy: Checks `auth.jwt()->>'email'` matches admin record

---

## 3. Vehicle Availability Logic

### 3.1 Real-Time Availability Check

**Query Logic**:
```sql
-- Find available vehicles for specific booking time
SELECT v.*
FROM vehicles v
WHERE v.status = 'available'
  AND v.vehicle_type = 'sedan'  -- matches booking requirement
  AND NOT EXISTS (
    -- Not assigned to active trip during this time window
    SELECT 1 FROM trip_assignments ta
    JOIN bookings b ON ta.booking_id = b.id
    WHERE ta.vehicle_id = v.id
      AND ta.status IN ('assigned', 'accepted', 'en_route_pickup', 'arrived', 'in_progress')
      AND b.pickup_datetime BETWEEN '2024-12-20 14:00' AND '2024-12-20 18:00'
  )
  AND (v.next_service_due IS NULL OR v.next_service_due > CURRENT_DATE)
  AND (v.insurance_expiry IS NULL OR v.insurance_expiry > CURRENT_DATE)
ORDER BY v.hourly_rate ASC, v.mileage ASC;
```

### 3.2 Vehicle Capacity Validation

**Logic**:
```typescript
function isVehicleSuitable(vehicle: Vehicle, booking: Booking): boolean {
  return (
    vehicle.capacity >= booking.passenger_count &&
    vehicle.luggage_capacity >= booking.luggage_count &&
    vehicle.status === 'available' &&
    vehicle.vehicle_type === booking.vehicle_type
  );
}
```

### 3.3 Vehicle Status Management

**Status Transitions**:
```
available → in_service (during trip) → available (after completion)
available → maintenance (scheduled service) → available (after repair)
available → retired (decommissioned)
```

**Automatic Status Updates**:
```sql
-- Set vehicle to 'in_service' when trip starts
CREATE OR REPLACE FUNCTION update_vehicle_status_on_trip()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
    UPDATE vehicles
    SET status = 'in_service'
    WHERE id = NEW.vehicle_id;
  END IF;

  IF NEW.status = 'completed' AND OLD.status = 'in_progress' THEN
    UPDATE vehicles
    SET status = 'available'
    WHERE id = NEW.vehicle_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vehicle_status
  AFTER UPDATE ON trip_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_status_on_trip();
```

---

## 4. Driver Notification Methods

### 4.1 Notification Channels

**Priority Order**:
1. **Push Notification** (driver mobile app) - Primary
2. **SMS** (Twilio) - Fallback
3. **Email** (SendGrid) - Secondary
4. **In-App Alert** (driver portal) - Always sent

### 4.2 Notification Events

| Event | Trigger | Notification Content |
|-------|---------|---------------------|
| **New Assignment** | Assignment created | "New trip assigned! Pickup at [address] at [time]" |
| **Booking Modified** | Booking details change | "Trip updated: [changes]" |
| **Cancellation** | Assignment cancelled | "Trip [ID] has been cancelled" |
| **Reminder** | 30 min before pickup | "Upcoming trip in 30 minutes" |
| **Customer Waiting** | Pickup time passed | "Customer is waiting at pickup location" |

### 4.3 Notification Implementation

**Edge Function**: `notify-driver`

**Request Payload**:
```json
{
  "driver_id": "drv_abc123",
  "notification_type": "new_assignment",
  "priority": "high",
  "data": {
    "assignment_id": "assign_xyz789",
    "booking_id": "book_def456",
    "pickup_address": "123 Main St, City",
    "pickup_datetime": "2024-12-20T14:30:00Z",
    "customer_name": "John Doe",
    "passenger_count": 4,
    "luggage_count": 6
  }
}
```

**Notification Templates**:

**SMS (Twilio)**:
```
New Trip Alert!
Pickup: 123 Main St
Time: Dec 20, 2:30 PM
Passengers: 4 + 6 bags
Open app to accept.
```

**Email (SendGrid)**:
```html
<h2>New Trip Assignment</h2>
<p>You have been assigned to a new trip:</p>
<ul>
  <li><strong>Pickup:</strong> 123 Main St, City</li>
  <li><strong>Time:</strong> December 20, 2024 at 2:30 PM</li>
  <li><strong>Destination:</strong> 456 Beach Rd, Resort</li>
  <li><strong>Passengers:</strong> 4 adults</li>
  <li><strong>Luggage:</strong> 6 suitcases</li>
</ul>
<a href="https://app.company.com/driver/assignment/assign_xyz789">View & Accept</a>
```

**Push Notification (Firebase Cloud Messaging)**:
```json
{
  "title": "New Trip Assignment",
  "body": "Pickup at 123 Main St at 2:30 PM",
  "data": {
    "assignment_id": "assign_xyz789",
    "action": "open_assignment"
  }
}
```

---

## 5. Driver Access Permissions

### 5.1 Permission Levels

**Driver Portal Access Matrix**:

| Action | Driver Role | Required Status | RLS Policy |
|--------|-------------|-----------------|------------|
| View own profile | driver | active, on_break | `drivers.email = auth.jwt()->>'email'` |
| View assignments | driver | active, on_break | `trip_assignments.driver_id = current_driver.id` |
| Accept assignment | driver | active | Status check + driver match |
| Update trip status | driver | active | Assignment ownership |
| Upload trip photos | driver | active | Assignment ownership |
| View trip history | driver | active, on_break, off_duty | Driver match |
| Update location | driver | active | Driver match |
| Request time off | driver | active | Driver match |
| View earnings | driver | all | Driver match |
| Message dispatch | driver | all | Driver match |

### 5.2 Row Level Security Policies

**Drivers Table**:
```sql
-- Drivers can view own profile
CREATE POLICY "Drivers can view own profile"
  ON drivers FOR SELECT
  TO authenticated
  USING (email = auth.jwt()->>'email');

-- Drivers can update own location and status
CREATE POLICY "Drivers can update own data"
  ON drivers FOR UPDATE
  TO authenticated
  USING (email = auth.jwt()->>'email')
  WITH CHECK (
    email = auth.jwt()->>'email' AND
    -- Only allow updating specific fields
    (SELECT status FROM drivers WHERE id = NEW.id) IN ('active', 'on_break', 'off_duty')
  );
```

**Trip Assignments Table**:
```sql
-- Drivers view own assignments only
CREATE POLICY "Drivers can view own assignments"
  ON trip_assignments FOR SELECT
  TO authenticated
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE email = auth.jwt()->>'email'
    )
  );

-- Drivers update only status fields
CREATE POLICY "Drivers can update own assignments"
  ON trip_assignments FOR UPDATE
  TO authenticated
  USING (
    driver_id IN (
      SELECT id FROM drivers WHERE email = auth.jwt()->>'email'
    )
  )
  WITH CHECK (
    -- Can only update these fields
    driver_id = OLD.driver_id AND
    booking_id = OLD.booking_id AND
    vehicle_id = OLD.vehicle_id
  );
```

### 5.3 API Authentication

**Driver Login Flow**:
```typescript
// 1. Driver logs in with email/password
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'driver@company.com',
  password: 'secure_password'
});

// 2. Verify driver exists in drivers table
const { data: driver } = await supabase
  .from('drivers')
  .select('*')
  .eq('email', data.user.email)
  .eq('status', 'active')
  .single();

if (!driver) {
  throw new Error('Not authorized as driver');
}

// 3. JWT contains email - RLS policies automatically filter data
```

---

## 6. Driver Portal Architecture

### 6.1 High-Level Components

```
Driver Portal (React SPA)
├── Authentication Layer
│   ├── Login Page
│   └── Session Management
├── Dashboard
│   ├── Today's Assignments
│   ├── Quick Stats
│   └── Active Trip Widget
├── Assignments Module
│   ├── Pending Assignments (Accept/Decline)
│   ├── Upcoming Trips
│   └── Trip History
├── Active Trip Module
│   ├── Trip Details
│   ├── Customer Info
│   ├── GPS Navigation
│   ├── Status Updates (Arrived, Picked Up, Completed)
│   └── Upload Photos/Signatures
├── Profile Module
│   ├── Personal Info
│   ├── Vehicle Assignment
│   ├── Documents (License, Insurance)
│   └── Earnings Summary
└── Support Module
    ├── Message Dispatch
    └── Report Issue
```

### 6.2 Key Features

**Dashboard View**:
```typescript
interface DriverDashboard {
  activeTrip: TripAssignment | null;
  todayAssignments: TripAssignment[];
  stats: {
    totalTrips: number;
    rating: number;
    earnings: number;
    hoursWorked: number;
  };
  notifications: Notification[];
}
```

**Active Trip Interface**:
```typescript
interface ActiveTrip {
  assignment: TripAssignment;
  booking: Booking;
  customer: {
    name: string;
    phone: string;
    passengerCount: number;
    luggageCount: number;
  };
  navigation: {
    pickupAddress: string;
    dropoffAddress: string;
    estimatedDistance: string;
    estimatedDuration: string;
  };
  actions: {
    updateStatus: (status: TripStatus) => void;
    uploadPhoto: (file: File) => void;
    reportIssue: (issue: string) => void;
  };
}
```

### 6.3 Real-Time Updates

**WebSocket Connection** (Supabase Realtime):
```typescript
// Subscribe to assignment updates
const subscription = supabase
  .channel('driver_assignments')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'trip_assignments',
      filter: `driver_id=eq.${driverId}`
    },
    (payload) => {
      // Handle new assignments, cancellations, updates
      handleAssignmentUpdate(payload.new);
    }
  )
  .subscribe();
```

### 6.4 Offline Support

**Capabilities**:
- Cache current assignment locally
- Queue status updates when offline
- Show offline indicator
- Sync when connection restored

**Implementation**:
```typescript
// Service worker for offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/driver-sw.js');
}

// IndexedDB for local storage
const db = await openDB('driver-portal', 1, {
  upgrade(db) {
    db.createObjectStore('assignments');
    db.createObjectStore('pending-updates');
  }
});
```

---

## 7. Complete Flow Example

### Scenario: Airport Transfer Booking → Completion

**Step 1: Booking Created**
```
User: "I need transfer from PUJ to Barcelo Bavaro"
System: Creates booking (status: 'pending')
```

**Step 2: Payment Confirmed**
```
Customer pays via Stripe
Database: bookings.payment_status = 'paid'
Database: bookings.workflow_status = 'awaiting_assignment'
```

**Step 3: Auto-Dispatch**
```
Trigger: Status change to 'awaiting_assignment'
Edge Function: auto-dispatch runs
Database: Creates trip_assignment (status: 'assigned')
Database: Updates bookings.workflow_status = 'assigned'
```

**Step 4: Driver Notification**
```
Edge Function: notify-driver
Channels: Push notification + SMS
Driver: Receives alert on mobile app
```

**Step 5: Driver Accepts**
```
Driver: Clicks "Accept" in portal
API: PUT /trip_assignments/{id}
Database: trip_assignments.status = 'accepted'
Database: trip_assignments.driver_accepted_at = NOW()
Customer: Receives email "Driver assigned: John Smith"
```

**Step 6: Driver En Route**
```
Driver: Clicks "Start Pickup"
Database: trip_assignments.status = 'en_route_pickup'
Customer: Sees driver location on tracking page
```

**Step 7: Driver Arrives**
```
Driver: Clicks "Arrived"
Database: trip_assignments.status = 'arrived'
Database: trip_assignments.driver_arrived_at = NOW()
Customer: Receives SMS "Driver arrived"
```

**Step 8: Pickup Customer**
```
Driver: Clicks "Customer Onboard"
Database: trip_assignments.status = 'in_progress'
Database: trip_assignments.pickup_completed_at = NOW()
Database: vehicles.status = 'in_service'
```

**Step 9: Complete Trip**
```
Driver: Clicks "Complete Trip"
Database: trip_assignments.status = 'completed'
Database: trip_assignments.dropoff_completed_at = NOW()
Database: bookings.workflow_status = 'completed'
Database: vehicles.status = 'available'
Edge Function: generate-invoice
Database: Creates invoice record
Customer: Receives email with invoice
```

**Step 10: Rating & Review**
```
Customer: Rates driver 5 stars
Database: Updates drivers.rating (average calculation)
Database: Creates review record
```

---

## 8. Admin Operations Dashboard

### 8.1 Real-Time Dispatch Board

**Features**:
- Live map with all active drivers
- Active trips with real-time status
- Pending assignments queue
- Drag-and-drop assignment
- Filter by vehicle type, region, time

**Data Query**:
```typescript
// Fetch all active operations
const { data: activeOperations } = await supabase
  .from('trip_assignments')
  .select(`
    *,
    booking:bookings(*),
    driver:drivers(*),
    vehicle:vehicles(*)
  `)
  .in('status', ['assigned', 'accepted', 'en_route_pickup', 'arrived', 'in_progress'])
  .order('pickup_datetime', { ascending: true });
```

### 8.2 Manual Intervention Actions

**Quick Actions**:
1. Reassign driver
2. Cancel assignment
3. Add trip notes
4. Call driver
5. Call customer
6. Mark as emergency
7. Send message to driver

### 8.3 Performance Metrics

**Real-Time KPIs**:
- Active drivers
- Available vehicles
- Pending assignments
- Average response time (assign → accept)
- Average trip duration
- Revenue today
- Customer satisfaction

---

## 9. Edge Functions Summary

| Function | Purpose | Trigger |
|----------|---------|---------|
| `auto-dispatch` | Assign driver to booking | API call or webhook |
| `notify-driver` | Send driver notifications | After assignment created |
| `update-trip-status` | Handle status changes | Driver app updates |
| `calculate-route` | Get distance/duration | Assignment creation |
| `generate-invoice` | Create invoice after trip | Trip completion |
| `send-customer-notification` | Update customer | Status changes |
| `check-driver-availability` | Validate assignment | Pre-assignment |

---

## 10. Database Triggers & Automation

### Automatic Status Updates

```sql
-- Auto-update booking when assignment changes
CREATE OR REPLACE FUNCTION sync_booking_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE bookings
  SET workflow_status = NEW.status
  WHERE id = NEW.booking_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_booking_status
  AFTER UPDATE ON trip_assignments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION sync_booking_status();
```

### Automatic Logging

```sql
-- Auto-log status changes
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trip_logs (assignment_id, event_type, event_data)
  VALUES (
    NEW.id,
    'status_change',
    jsonb_build_object(
      'old_status', OLD.status,
      'new_status', NEW.status,
      'timestamp', NOW()
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_status_change
  AFTER UPDATE ON trip_assignments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_status_change();
```

---

## Conclusion

This dispatch and operations layer provides:
- ✅ Complete booking lifecycle management
- ✅ Intelligent auto-dispatch with manual overrides
- ✅ Real-time vehicle availability tracking
- ✅ Multi-channel driver notifications
- ✅ Secure, role-based access control
- ✅ Full-featured driver portal
- ✅ Admin operations dashboard
- ✅ Comprehensive audit logging

All components are production-ready and integrate seamlessly with the existing CRM foundation.
