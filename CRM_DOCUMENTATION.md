# Transportation CRM System - Complete Documentation

## Overview

A modern, AI-powered CRM system for transportation and limousine businesses, built to integrate seamlessly with an existing chat-based booking system. Comparable to Limo Anywhere but simpler, AI-first, and built for scale.

## System Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Functions**: Supabase Edge Functions (Deno)
- **APIs**: Google Maps (distance, geocoding, zones)
- **Payments**: Stripe

### Core Components

#### 1. **Customer Relationship Management**
- Complete customer profiles with contact history
- Corporate account management with billing terms
- Multi-address storage for quick bookings
- Customer preferences and service requirements
- VIP status and lifetime value tracking

#### 2. **Fleet Management**
- Vehicle inventory with full specifications
- Maintenance tracking and scheduling
- Real-time vehicle status and location
- Insurance and registration expiration alerts

#### 3. **Driver Management**
- Complete driver profiles with credentials
- License verification and expiration tracking
- Background check status
- Performance ratings and trip history
- Schedule and availability management
- Multi-language support

#### 4. **Dynamic Pricing Engine**
- Geographic zone management (airports, cities, landmarks)
- Rule-based pricing with priority system
- Distance and time-based calculations
- Peak hour multipliers
- Zone-to-zone flat rates
- Corporate rate cards with discounts
- Quote generation and tracking
- Automatic quote expiration

#### 5. **Dispatch System**
- Real-time booking management
- Auto-dispatch with AI recommendations
- Manual driver assignment
- Driver availability tracking
- Trip lifecycle management
- GPS event logging

#### 6. **Financial Management**
- Formal invoicing system
- Payment tracking (card, bank transfer, corporate billing)
- Corporate credit limits and terms
- Revenue reporting
- Commission tracking

## Database Schema

### Customer Management
- `customers` - Core CRM customer profiles
- `corporate_accounts` - B2B customer accounts
- `customer_addresses` - Multi-address support
- `customer_preferences` - Service preferences

### Fleet & Operations
- `vehicles` - Fleet inventory
- `drivers` - Driver staff management
- `driver_availability` - Schedule management
- `vehicle_maintenance_logs` - Service history

### Pricing & Quotes
- `pricing_zones` - Geographic service areas
- `pricing_rules` - Dynamic pricing rule engine
- `corporate_rate_cards` - B2B negotiated rates
- `price_quotes` - Quote history and tracking

### Dispatch & Trips
- `trip_assignments` - Driver/vehicle dispatch records
- `trip_logs` - Real-time trip event tracking
- `bookings` (enhanced) - CRM-integrated bookings

### Financial
- `invoices` - Formal billing records
- `orders` - Financial transaction tracking

### Users & Access
- `agent_users` - Dispatch agent management
- `admin_users` - System administrators
- `partners` - Partner organizations
- `support_agents` - Customer support team

## Edge Functions

### 1. `calculate-quote`
**Purpose**: Dynamic pricing engine for generating quotes

**Input**:
```json
{
  "from_address": "JFK Airport",
  "to_address": "Manhattan",
  "pickup_datetime": "2024-12-15T14:00:00Z",
  "vehicle_type": "sedan",
  "passenger_count": 2,
  "luggage_count": 2,
  "customer_id": "uuid (optional)",
  "corporate_account_id": "uuid (optional)"
}
```

**Output**:
```json
{
  "success": true,
  "quote": {
    "quote_number": "QT-20241214-1234",
    "total_price": 75.00,
    "base_price": 15.00,
    "distance_price": 60.00,
    "multipliers_applied": [],
    "expires_at": "2024-12-15T14:00:00Z"
  }
}
```

**Features**:
- Zone detection and matching
- Rule-based pricing with priority
- Time-based multipliers (peak hours)
- Corporate rate card application
- Minimum charge enforcement
- Quote expiration (24 hours)

### 2. `sync-booking-from-chat`
**Purpose**: Automatically ingests chat bookings into CRM

**Input**:
```json
{
  "conversation_id": "uuid",
  "booking_type": "airport_transfer",
  "customer_email": "john@example.com",
  "customer_name": "John Doe",
  "customer_phone": "+1-555-0123",
  "pickup_address": "123 Main St, New York, NY",
  "dropoff_address": "JFK Airport",
  "pickup_datetime": "2024-12-15T14:00:00Z",
  "vehicle_type": "sedan",
  "passenger_count": 2,
  "luggage_count": 2,
  "special_requests": "Child seat required",
  "price": 75.00
}
```

**Output**:
```json
{
  "success": true,
  "customer_id": "uuid",
  "booking_id": "uuid",
  "order_id": "uuid",
  "message": "Booking synced to CRM successfully"
}
```

**Features**:
- Auto-create or update customer records
- Link bookings to customer CRM profiles
- Create order records for financial tracking
- Update customer statistics (total bookings, last booking date)
- Create default customer preferences

### 3. `auto-dispatch`
**Purpose**: AI-assisted driver assignment

**Input**:
```json
{
  "booking_id": "uuid",
  "preferred_driver_id": "uuid (optional)",
  "vehicle_type": "sedan (optional)",
  "pickup_datetime": "2024-12-15T14:00:00Z (optional)"
}
```

**Output**:
```json
{
  "success": true,
  "assignment": {
    "id": "uuid",
    "booking_id": "uuid",
    "driver_id": "uuid",
    "vehicle_id": "uuid",
    "status": "assigned"
  },
  "driver": {
    "first_name": "Michael",
    "last_name": "Rodriguez",
    "rating": 4.8
  },
  "vehicle": {
    "vehicle_type": "sedan",
    "make": "Toyota",
    "model": "Camry"
  }
}
```

**Features**:
- Check for existing active assignments
- Vehicle type matching
- Driver availability verification
- Preferred driver prioritization
- Rating-based driver selection
- Automatic booking status updates
- Trip log creation

## Agent Portal

### Access
1. Click the **Agent Portal** icon (UserCog) in the chat header
2. Login with: `dispatch@example.com`

### Dashboard
- Real-time statistics:
  - Total bookings and pending count
  - Active trips in progress
  - Today's revenue
  - Available drivers and vehicles
  - Booking rate trends
- Recent bookings list with customer info
- Quick status overview

### Booking Management
- Search and filter bookings
- View customer details
- Track booking lifecycle
- Payment status monitoring
- Assignment status

### Dispatch Board
- View pending bookings requiring assignment
- See available drivers with ratings and vehicles
- One-click auto-dispatch
- Manual driver assignment
- Real-time driver availability
- Vehicle type matching

## Pricing Configuration

### Setting Up Zones
```sql
-- Example: Add a new airport zone
INSERT INTO pricing_zones (zone_name, zone_code, zone_type, center_point, is_active)
VALUES (
  'Miami Airport',
  'MIA',
  'airport',
  '{"lat": 25.7959, "lng": -80.2870}'::jsonb,
  true
);
```

### Creating Pricing Rules
```sql
-- Example: Peak hour multiplier
INSERT INTO pricing_rules (
  rule_name,
  rule_type,
  priority,
  time_multiplier,
  day_of_week,
  time_range_start,
  time_range_end,
  is_active
) VALUES (
  'Weekend Evening Surge',
  'time_multiplier',
  30,
  1.5,
  '[6,7]'::jsonb,  -- Saturday and Sunday
  '18:00',
  '23:00',
  true
);

-- Example: Zone-to-zone flat rate
INSERT INTO pricing_rules (
  rule_name,
  rule_type,
  priority,
  vehicle_types,
  from_zone_id,
  to_zone_id,
  base_price,
  is_active
) VALUES (
  'MIA to South Beach - Sedan',
  'zone_to_zone',
  5,
  '["sedan"]'::jsonb,
  'zone-uuid-1',
  'zone-uuid-2',
  55.00,
  true
);
```

### Corporate Rate Cards
```sql
-- Example: Corporate negotiated rate
INSERT INTO corporate_rate_cards (
  corporate_account_id,
  route_name,
  from_zone_id,
  to_zone_id,
  vehicle_type,
  flat_rate,
  valid_from,
  is_active
) VALUES (
  'corporate-account-uuid',
  'Airport to Corporate HQ',
  'airport-zone-uuid',
  'downtown-zone-uuid',
  'sedan',
  50.00,
  CURRENT_DATE,
  true
);
```

## Integration with Chat System

### Automatic Booking Sync
When a booking is completed via the chat interface, call the sync function:

```javascript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/sync-booking-from-chat`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      customer_email: 'customer@example.com',
      customer_name: 'Jane Smith',
      pickup_address: 'JFK Airport',
      dropoff_address: 'Manhattan',
      pickup_datetime: '2024-12-15T14:00:00Z',
      vehicle_type: 'sedan',
      passenger_count: 2,
      price: 75.00,
    }),
  }
);
```

### Getting Dynamic Quotes
```javascript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/calculate-quote`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from_address: 'JFK Airport',
      to_address: 'Manhattan',
      pickup_datetime: '2024-12-15T14:00:00Z',
      vehicle_type: 'sedan',
    }),
  }
);

const { quote } = await response.json();
console.log(`Total Price: $${quote.total_price}`);
```

## Workflow Examples

### Complete Booking Flow
1. Customer requests transfer via chat
2. AI agent collects: pickup, dropoff, date/time, vehicle type, passengers
3. System calls `calculate-quote` to get dynamic pricing
4. Customer confirms and provides contact info
5. System calls `sync-booking-from-chat` to create CRM records
6. Agent portal shows booking in "Pending" status
7. Agent clicks "Auto-Assign" or manually assigns driver
8. System creates trip_assignment record
9. Driver receives notification (future integration)
10. Driver updates status via mobile app (future integration)
11. Trip completes, invoice generated automatically

### Corporate Account Flow
1. Create corporate account with credit terms
2. Add corporate rate cards for common routes
3. Create customer records linked to corporate account
4. Bookings automatically apply corporate rates
5. Invoices aggregate monthly for NET30 billing
6. Corporate account manager reviews via admin portal

## Sample Data Included

### Zones
- JFK Airport, LaGuardia Airport, Newark Airport
- Manhattan, Brooklyn, Queens
- Jersey City, Long Island

### Pricing Rules
- Base rates for all vehicle types
- Distance-based pricing per vehicle type
- Peak hour multipliers (7-9 AM, 5-7 PM weekdays)
- Major airport flat rates to Manhattan

### Fleet
- 2 Sedans (Toyota Camry, Honda Accord)
- 1 SUV (Chevrolet Suburban)
- 1 Van (Mercedes Sprinter)
- 1 Luxury (BMW 7 Series)

### Drivers
- Michael Rodriguez (4.8★, 523 trips, speaks EN/ES)
- Sarah Johnson (4.9★, 712 trips)
- David Chen (4.7★, 445 trips, speaks EN/ZH)

### Corporate Accounts
- TechCorp Inc (15% discount, NET30)
- Global Consulting LLC (10% discount, NET30)

## Security Features

### Row Level Security (RLS)
All tables have RLS enabled with role-based policies:

- **Admins**: Full access to all data
- **Agents**: View and manage bookings, customers, dispatch
- **Drivers**: View own assignments, update location/status
- **Partners**: View own vehicles, drivers, bookings only
- **Customers**: View own bookings and invoices (future)

### Authentication
- Agent users authenticated via email
- Session management
- Secure JWT tokens
- Role verification on all operations

## Future Enhancements

### Phase 2 - Advanced Features
- AI-powered route optimization
- Predictive maintenance scheduling
- Demand-based surge pricing
- Customer sentiment analysis
- Driver performance analytics

### Phase 3 - Mobile Apps
- Driver mobile app (React Native)
- Customer mobile app
- Real-time GPS tracking
- In-app messaging

### Phase 4 - Integrations
- Google Calendar sync
- QuickBooks integration
- Twilio SMS notifications
- Stripe Connect for partner payouts

## API Reference

### Base URLs
- **Supabase API**: `https://your-project.supabase.co`
- **Edge Functions**: `https://your-project.supabase.co/functions/v1`

### Authentication
All Edge Function requests require:
```
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

### Common Patterns

**Query with RLS**:
```javascript
const { data, error } = await supabase
  .from('bookings')
  .select('*, customers(*)')
  .eq('workflow_status', 'pending');
```

**Create with Relations**:
```javascript
const { data: booking } = await supabase
  .from('bookings')
  .insert({
    customer_id: customerId,
    pickup_address: 'JFK Airport',
    dropoff_address: 'Manhattan',
    pickup_datetime: '2024-12-15T14:00:00Z',
    vehicle_type: 'sedan',
    price: 75.00,
  })
  .select()
  .single();
```

## Troubleshooting

### Common Issues

**1. Edge Function Returns 401**
- Check Authorization header is set
- Verify SUPABASE_ANON_KEY is correct
- Check function JWT verification setting

**2. No Drivers Available for Dispatch**
- Verify drivers have `status = 'active'`
- Check drivers have assigned vehicles
- Ensure no active trip assignments exist

**3. Pricing Quote Returns Zero**
- Check pricing rules exist and are active
- Verify zones are configured for addresses
- Review rule priorities and conditions
- Check minimum charge settings

**4. RLS Policy Blocks Access**
- Verify user authentication
- Check user role in admin_users or agent_users table
- Review policy conditions in migration files

## Support

For issues or questions:
- Check migration files in `supabase/migrations/`
- Review Edge Function code in `supabase/functions/`
- Examine component code in `src/components/agent/`

## License

Proprietary - All rights reserved
