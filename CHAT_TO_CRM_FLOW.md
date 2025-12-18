# Chat to CRM Booking Flow - Complete Technical Guide

## Overview

This document describes the complete end-to-end flow from a user chatting with the AI travel agent to creating a confirmed booking in the CRM system, including payment and notifications.

**Key Components:**
- Frontend: React chat interface (ChatMessage, ChatHistory components)
- AI Agent: TravelAgent class (`src/lib/travelAgent.ts`)
- Edge Functions: `sync-booking-from-chat`, `calculate-quote`
- Database: Supabase (customers, bookings, orders, payments tables)

---

## Flow Diagram

```
User Chat Input
    ↓
[1] TravelAgent.processMessage() - Intent Extraction
    ↓
[2] Price Calculation (Local Pricing Table)
    ↓
[3] BookingAction Generated
    ↓
[4] ChatBookingModal Opens (Frontend)
    ↓
[5] Customer Fills Form
    ↓
[6] sync-booking-from-chat Edge Function
    ↓
[7] CRM Records Created (Customer → Booking → Order)
    ↓
[8] Payment Processing (Optional)
    ↓
[9] Status Updates & Notifications
    ↓
[10] Assignment to Driver (Optional)
```

---

## Step-by-Step Flow with JSON Examples

### Step 1: User Chat Input

**Location**: Frontend React component (`ChatHistory.tsx`)

User types a message in the chat interface. The message is sent to the TravelAgent for processing.

**Example User Input:**
```
"Hi, I need a transfer from PUJ to Barcelo Bavaro for 4 people with 6 suitcases"
```

**Frontend Action:**
```typescript
const response = await travelAgent.processMessage(userMessage);
```

---

### Step 2: Intent Extraction & Conversation Flow

**Location**: `src/lib/travelAgent.ts` - `TravelAgent.processMessage()`

**Responsible for:**
- Multi-turn conversation state management
- Extracting booking details (airport, hotel, passengers, luggage)
- Recommending appropriate vehicles
- Calculating prices from static pricing table

**State Machine Steps:**
1. `IDLE` → Extract initial intent
2. `AWAITING_AIRPORT` → Extract airport code
3. `AWAITING_HOTEL` → Extract hotel/region
4. `AWAITING_PASSENGERS` → Extract passenger count
5. `AWAITING_LUGGAGE` → Extract luggage count
6. `AWAITING_TRIP_TYPE` → One-way or round trip
7. `AWAITING_CONFIRMATION` → Generate booking action

**Conversation Context Example:**
```json
{
  "step": "AWAITING_CONFIRMATION",
  "airport": "PUJ",
  "hotel": "Barcelo Bavaro Palace",
  "region": "Bavaro / Punta Cana",
  "vehicle": "Minivan",
  "passengers": 4,
  "suitcases": 6,
  "tripType": "One-way",
  "price": 70
}
```

---

### Step 3: Pricing Lookup

**Location**: `src/lib/travelAgent.ts` - Static pricing table `PRICING`

**How Pricing Works:**
- Hardcoded pricing matrix: `PRICING[airport][region][vehicle]`
- No external API calls (instant response)
- Returns both one-way and round-trip prices

**Pricing Lookup Example:**
```typescript
const price = PRICING['PUJ']['Bavaro / Punta Cana']['Minivan'].oneWay;
// Returns: 70 USD
```

**Available Vehicles & Capacity:**
```json
{
  "Sedan": { "maxPax": 3, "maxLuggage": 3 },
  "SUV": { "maxPax": 4, "maxLuggage": 4 },
  "Minivan": { "maxPax": 7, "maxLuggage": 8 },
  "Minibus": { "maxPax": 14, "maxLuggage": 14 }
}
```

---

### Step 4: Booking Action Generated

**Location**: `src/lib/travelAgent.ts` - `triggerBooking()`

When the user confirms ("Yes, book it!"), the agent generates a `BookingAction` object.

**BookingAction Interface:**
```typescript
interface BookingAction {
  action: 'START_BOOKING';
  airport: string;
  hotel: string;
  region: string;
  vehicle: string;
  passengers: number;
  suitcases: number;
  tripType: string;
  price: number;
  currency: string;
  paymentProvider: string;
  paymentMethods: string[];
}
```

**Example BookingAction JSON:**
```json
{
  "action": "START_BOOKING",
  "airport": "PUJ",
  "hotel": "Barcelo Bavaro Palace",
  "region": "Bavaro / Punta Cana",
  "vehicle": "Minivan",
  "passengers": 4,
  "suitcases": 6,
  "tripType": "One-way",
  "price": 70,
  "currency": "USD",
  "paymentProvider": "Stripe",
  "paymentMethods": ["iDEAL", "Card"]
}
```

**Agent Response:**
```typescript
{
  message: "Wonderful! Opening your secure booking form now...",
  bookingAction: { /* BookingAction object */ },
  suggestions: []
}
```

---

### Step 5: Booking Modal Opens

**Location**: `src/components/ChatBookingModal.tsx`

**Frontend Trigger:**
```typescript
if (response.bookingAction) {
  setShowBookingModal(true);
  setBookingData(response.bookingAction);
}
```

**Modal Form Fields:**
- Full Name (required)
- Email Address (required)
- Phone Number (optional)
- Flight Number (optional)
- Arrival Date & Time (required)
- Special Requests (optional)

**Pre-filled from Chat:**
- Airport (pickup_address)
- Hotel (dropoff_address)
- Vehicle Type
- Passenger Count
- Luggage Count
- Price

---

### Step 6: Customer Submits Booking Form

**Location**: Frontend - Form submission in `ChatBookingModal.tsx`

Customer fills out personal details and submits. Frontend generates unique conversation ID.

**Form Submission Payload:**
```json
{
  "conversation_id": "conv_1734215890_xyz123",
  "booking_type": "airport_transfer",
  "customer_email": "john.doe@example.com",
  "customer_name": "John Doe",
  "customer_phone": "+1-555-123-4567",
  "pickup_address": "Punta Cana International Airport (PUJ)",
  "dropoff_address": "Barcelo Bavaro Palace",
  "pickup_datetime": "2024-12-20T14:30:00Z",
  "vehicle_type": "Minivan",
  "passenger_count": 4,
  "luggage_count": 6,
  "special_requests": "Please have child seat for 5-year-old",
  "price": 70,
  "details": {
    "airport_code": "PUJ",
    "region": "Bavaro / Punta Cana",
    "trip_type": "One-way",
    "flight_number": "AA1234"
  }
}
```

**Frontend API Call:**
```typescript
const response = await supabase.functions.invoke('sync-booking-from-chat', {
  body: bookingPayload
});
```

---

### Step 7: CRM Record Creation

**Location**: Edge Function - `supabase/functions/sync-booking-from-chat/index.ts`

**Responsible Edge Function**: `sync-booking-from-chat`

This edge function orchestrates all database writes and creates a complete booking in the CRM.

#### 7.1: Find or Create Customer

**Database Query:**
```sql
SELECT id FROM customers WHERE email = 'john.doe@example.com';
```

**If Customer Exists:**
```typescript
// Update existing customer stats
UPDATE customers
SET
  total_bookings = total_bookings + 1,
  last_booking_at = NOW()
WHERE id = customer_id;
```

**If New Customer:**
```typescript
// Insert new customer
INSERT INTO customers (
  email,
  phone,
  first_name,
  last_name,
  customer_type,
  total_bookings,
  last_booking_at
) VALUES (
  'john.doe@example.com',
  '+1-555-123-4567',
  'John',
  'Doe',
  'individual',
  1,
  NOW()
)
RETURNING id;
```

**Customer Record Created:**
```json
{
  "id": "cust_abc123xyz",
  "email": "john.doe@example.com",
  "phone": "+1-555-123-4567",
  "first_name": "John",
  "last_name": "Doe",
  "customer_type": "individual",
  "total_bookings": 1,
  "total_revenue": 0,
  "lifetime_value": 0,
  "last_booking_at": "2024-12-14T10:30:00Z",
  "created_at": "2024-12-14T10:30:00Z"
}
```

**Also Creates Customer Preferences:**
```sql
INSERT INTO customer_preferences (
  customer_id,
  preferred_vehicle_types
) VALUES (
  'cust_abc123xyz',
  ['Minivan']
);
```

#### 7.2: Create Booking Record

**Database Write:**
```sql
INSERT INTO bookings (
  conversation_id,
  booking_type,
  customer_id,
  pickup_address,
  dropoff_address,
  pickup_datetime,
  vehicle_type,
  passenger_count,
  luggage_count,
  special_requests,
  price,
  details,
  status,
  workflow_status,
  payment_status
) VALUES (
  'conv_1734215890_xyz123',
  'airport_transfer',
  'cust_abc123xyz',
  'Punta Cana International Airport (PUJ)',
  'Barcelo Bavaro Palace',
  '2024-12-20T14:30:00Z',
  'Minivan',
  4,
  6,
  'Please have child seat for 5-year-old',
  70.00,
  '{"airport_code": "PUJ", "region": "Bavaro / Punta Cana", "trip_type": "One-way", "flight_number": "AA1234"}',
  'pending',
  'pending',
  'pending'
)
RETURNING id;
```

**Booking Record Created:**
```json
{
  "id": "book_def456uvw",
  "conversation_id": "conv_1734215890_xyz123",
  "booking_type": "airport_transfer",
  "customer_id": "cust_abc123xyz",
  "pickup_address": "Punta Cana International Airport (PUJ)",
  "dropoff_address": "Barcelo Bavaro Palace",
  "pickup_datetime": "2024-12-20T14:30:00Z",
  "vehicle_type": "Minivan",
  "passenger_count": 4,
  "luggage_count": 6,
  "special_requests": "Please have child seat for 5-year-old",
  "price": 70.00,
  "details": {
    "airport_code": "PUJ",
    "region": "Bavaro / Punta Cana",
    "trip_type": "One-way",
    "flight_number": "AA1234"
  },
  "status": "pending",
  "workflow_status": "pending",
  "payment_status": "pending",
  "created_at": "2024-12-14T10:30:00Z",
  "updated_at": "2024-12-14T10:30:00Z"
}
```

**Note**: If a booking with the same `conversation_id` already exists, it updates instead of creating duplicate.

#### 7.3: Create Order Record (Financial Tracking)

**Database Write:**
```sql
INSERT INTO orders (
  booking_type,
  reference_id,
  item_name,
  quantity,
  unit_price,
  total_price,
  customer_email,
  customer_name,
  details,
  status,
  payment_status
) VALUES (
  'airport_transfer',
  'book_def456uvw',
  'Minivan - Punta Cana International Airport (PUJ) to Barcelo Bavaro Palace',
  1,
  70.00,
  70.00,
  'john.doe@example.com',
  'John Doe',
  '{"pickup_address": "PUJ", "dropoff_address": "Barcelo Bavaro Palace", ...}',
  'pending',
  'pending'
)
RETURNING id;
```

**Order Record Created:**
```json
{
  "id": "ord_ghi789rst",
  "booking_type": "airport_transfer",
  "reference_id": "book_def456uvw",
  "item_name": "Minivan - Punta Cana International Airport (PUJ) to Barcelo Bavaro Palace",
  "quantity": 1,
  "unit_price": 70.00,
  "total_price": 70.00,
  "customer_email": "john.doe@example.com",
  "customer_name": "John Doe",
  "details": {
    "pickup_address": "Punta Cana International Airport (PUJ)",
    "dropoff_address": "Barcelo Bavaro Palace",
    "pickup_datetime": "2024-12-20T14:30:00Z",
    "vehicle_type": "Minivan",
    "passenger_count": 4,
    "luggage_count": 6
  },
  "status": "pending",
  "payment_status": "pending",
  "created_at": "2024-12-14T10:30:00Z"
}
```

**Edge Function Response:**
```json
{
  "success": true,
  "customer_id": "cust_abc123xyz",
  "booking_id": "book_def456uvw",
  "order_id": "ord_ghi789rst",
  "message": "Booking synced to CRM successfully"
}
```

---

### Step 8: Payment Processing (Optional)

**Location**: Frontend - Payment form after booking creation

Payment can be processed immediately or later. The flow supports:
- Stripe credit card payments
- iDEAL payments
- Cash payments (in-person)
- Corporate billing (invoice later)

#### 8.1: If Payment is Immediate (Stripe)

**Frontend Stripe Payment:**
```typescript
const stripe = await loadStripe(publishableKey);
const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: {
      name: 'John Doe',
      email: 'john.doe@example.com'
    }
  }
});
```

**On Payment Success:**
```typescript
// Update booking payment status
await supabase
  .from('bookings')
  .update({
    payment_status: 'paid',
    status: 'confirmed',
    workflow_status: 'awaiting_assignment'
  })
  .eq('id', bookingId);

// Create payment record
await supabase
  .from('payments')
  .insert({
    booking_id: bookingId,
    customer_id: customerId,
    amount: 70.00,
    payment_method: 'stripe_card',
    payment_status: 'completed',
    transaction_id: paymentIntent.id,
    payment_details: {
      last4: '4242',
      brand: 'visa',
      country: 'US'
    }
  });
```

**Payment Record Created:**
```json
{
  "id": "pay_jkl012mno",
  "booking_id": "book_def456uvw",
  "customer_id": "cust_abc123xyz",
  "order_id": "ord_ghi789rst",
  "amount": 70.00,
  "currency": "USD",
  "payment_method": "stripe_card",
  "payment_status": "completed",
  "transaction_id": "pi_3Xyz123ABC456",
  "payment_details": {
    "last4": "4242",
    "brand": "visa",
    "country": "US"
  },
  "processed_at": "2024-12-14T10:31:00Z",
  "created_at": "2024-12-14T10:31:00Z"
}
```

#### 8.2: If Payment is Later

**Booking Status:**
```json
{
  "status": "confirmed",
  "payment_status": "pending",
  "workflow_status": "awaiting_payment"
}
```

Customer can pay later via:
- Email payment link
- Agent portal payment collection
- Cash on pickup
- Corporate invoice

---

### Step 9: Status Updates & Workflow Progression

**Location**: Various - triggered by events

#### Booking Status Flow:
```
pending → confirmed → assigned → in_progress → completed → archived
```

#### Payment Status Flow:
```
pending → processing → paid → refunded
```

#### Workflow Status Flow:
```
pending → awaiting_payment → awaiting_assignment → assigned → driver_en_route →
in_transit → completed → archived
```

**Database Updates on Payment:**
```sql
UPDATE bookings SET
  status = 'confirmed',
  payment_status = 'paid',
  workflow_status = 'awaiting_assignment',
  confirmed_at = NOW()
WHERE id = 'book_def456uvw';

UPDATE orders SET
  status = 'confirmed',
  payment_status = 'paid',
  confirmed_at = NOW()
WHERE id = 'ord_ghi789rst';

UPDATE customers SET
  total_revenue = total_revenue + 70.00,
  lifetime_value = lifetime_value + 70.00
WHERE id = 'cust_abc123xyz';
```

---

### Step 10: Notifications (If Configured)

**Location**: Edge Functions or Frontend

Notifications are sent when APIs are configured in Admin → API Integrations.

#### Email Notification (SendGrid)

**If SendGrid is configured:**
```typescript
await supabase.functions.invoke('send-email-notification', {
  body: {
    to: 'john.doe@example.com',
    template: 'booking_confirmation',
    data: {
      booking_id: 'book_def456uvw',
      customer_name: 'John Doe',
      pickup_address: 'PUJ Airport',
      dropoff_address: 'Barcelo Bavaro Palace',
      pickup_datetime: '2024-12-20T14:30:00Z',
      vehicle_type: 'Minivan',
      price: 70.00,
      confirmation_code: 'ABC123'
    }
  }
});
```

#### SMS Notification (Twilio)

**If Twilio is configured:**
```typescript
await supabase.functions.invoke('send-sms-notification', {
  body: {
    to: '+1-555-123-4567',
    message: 'Your transfer is confirmed! Booking ABC123 - Minivan pickup at PUJ on Dec 20 at 2:30 PM. Total: $70. We will send driver details 24hrs before.'
  }
});
```

---

### Step 11: Driver Assignment (Optional - Agent Portal)

**Location**: Agent Portal - `src/components/agent/DispatchBoard.tsx`

Agents can manually assign or use auto-dispatch:

#### Manual Assignment:
```typescript
await supabase
  .from('trip_assignments')
  .insert({
    booking_id: 'book_def456uvw',
    driver_id: 'driver_xyz789',
    vehicle_id: 'vehicle_abc123',
    assignment_type: 'manual',
    status: 'assigned',
    assigned_by: 'agent_user_id'
  });

await supabase
  .from('bookings')
  .update({
    workflow_status: 'assigned',
    assigned_driver_id: 'driver_xyz789',
    assigned_at: new Date().toISOString()
  })
  .eq('id', 'book_def456uvw');
```

#### Auto-Dispatch (Edge Function):
```typescript
await supabase.functions.invoke('auto-dispatch', {
  body: {
    booking_id: 'book_def456uvw'
  }
});
```

**Auto-dispatch selects driver based on:**
- Vehicle type match
- Driver availability
- Distance from pickup location
- Driver rating
- Current workload

---

## Database Tables Involved

### Primary Tables Written To:

1. **customers** - Customer master record
2. **customer_preferences** - Customer preferences (vehicle, payment, etc.)
3. **bookings** - Main booking record
4. **orders** - Financial transaction record
5. **payments** - Payment transaction details
6. **trip_assignments** - Driver assignment (optional)

### Supporting Tables Read From:

1. **pricing_zones** - Geographic pricing zones
2. **pricing_rules** - Dynamic pricing rules (future)
3. **vehicles** - Available fleet
4. **drivers** - Available drivers
5. **api_integrations** - Configured APIs

---

## Error Handling

### Frontend Errors:
```typescript
try {
  const response = await supabase.functions.invoke('sync-booking-from-chat', {
    body: bookingPayload
  });
  if (response.error) {
    showError('Failed to create booking. Please try again.');
  }
} catch (error) {
  showError('Network error. Please check connection.');
}
```

### Backend Errors:
```typescript
// Edge function returns detailed errors
{
  "error": "Missing required fields: customer_email, customer_name",
  "status": 400
}

// Or internal errors
{
  "error": "Database constraint violation",
  "details": "duplicate key value violates unique constraint",
  "status": 500
}
```

---

## Key Points

1. **No Code Changes Required**: The chat frontend works without modifications. All CRM integration happens server-side.

2. **Idempotency**: Using `conversation_id` prevents duplicate bookings if user clicks "Book" multiple times.

3. **Graceful Degradation**: System works even if optional APIs (SendGrid, Twilio, Stripe) are not configured.

4. **Audit Trail**: Every record has `created_at` and `updated_at` timestamps for tracking.

5. **Real-time Sync**: Booking appears in Agent Portal immediately after creation.

6. **Multi-currency Support**: Ready for international expansion (currently USD only).

7. **Corporate Accounts**: System can link bookings to corporate accounts for billing.

---

## Testing the Flow

### Test End-to-End:

1. **Start Chat**: "Hi, I need a transfer"
2. **Provide Details**: Follow agent prompts
3. **Confirm Booking**: "Yes, book it!"
4. **Fill Form**: Enter email, name, phone
5. **Submit**: Click "Book Transfer"
6. **Verify in CRM**: Check Agent Portal for new booking
7. **Check Database**: Query `bookings`, `orders`, `customers` tables

### Test Queries:

```sql
-- Check customer was created
SELECT * FROM customers WHERE email = 'john.doe@example.com';

-- Check booking was created
SELECT * FROM bookings WHERE conversation_id = 'conv_1734215890_xyz123';

-- Check order was created
SELECT * FROM orders WHERE reference_id = 'book_def456uvw';

-- Check full booking details
SELECT
  b.*,
  c.first_name,
  c.last_name,
  c.email,
  o.total_price,
  o.payment_status
FROM bookings b
JOIN customers c ON b.customer_id = c.id
LEFT JOIN orders o ON o.reference_id = b.id
WHERE b.id = 'book_def456uvw';
```

---

## Performance Considerations

1. **Chat Response Time**: < 200ms (local pricing, no API calls)
2. **Booking Creation**: < 2 seconds (3 database writes)
3. **Payment Processing**: 2-5 seconds (Stripe API)
4. **Notification Sending**: Async (doesn't block booking)

---

## Future Enhancements

1. **Real-time Distance Calculation**: Use Google Maps API for dynamic pricing
2. **Flight Tracking**: Auto-update pickup time based on flight delays
3. **Dynamic Pricing**: Surge pricing during peak times
4. **Multi-leg Trips**: Support for multiple stops
5. **Recurring Bookings**: Save favorite routes for regular customers
