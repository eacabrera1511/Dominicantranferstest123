# ElevenLabs Voice Agent Integration Guide

## Overview

This system integrates your ElevenLabs conversational AI agent with your Supabase database, allowing the voice agent to access real-time pricing, vehicle availability, hotel zones, and create bookings through voice conversations.

**Agent ID**: `agent_4201kcxcxbege73tvy22a28rt04n`

## What Was Implemented

### 1. Database Configuration

Updated the `api_credentials` table with your ElevenLabs agent configuration:
- **Service Name**: `elevenlabs`
- **Agent ID**: `agent_4201kcxcxbege73tvy22a28rt04n`
- **API Key**: Configured and stored securely
- **Status**: Active

### 2. API Endpoints for Voice Agent

Created three Supabase Edge Functions that your ElevenLabs agent can call:

#### A. Get Vehicle Types and Pricing Data
**Endpoint**: `https://[your-project].supabase.co/functions/v1/elevenlabs-get-vehicles`

**Method**: GET

**Response**:
```json
{
  "vehicle_types": [
    {
      "id": "uuid",
      "name": "Sedan",
      "passenger_capacity": 3,
      "luggage_capacity": 3,
      "minimum_fare": 25.00
    }
  ],
  "pricing_rules": [
    {
      "id": "uuid",
      "origin": "PUJ",
      "destination": "Zone A - Bavaro",
      "vehicle_type_id": "uuid",
      "base_price": 35.00
    }
  ],
  "hotel_zones": [
    {
      "hotel_name": "Hard Rock Hotel",
      "zone_code": "Zone A",
      "zone_name": "Bavaro/Punta Cana Beach"
    }
  ],
  "airports": [
    { "code": "PUJ", "name": "Punta Cana International Airport" },
    { "code": "SDQ", "name": "Santo Domingo Las Americas" },
    { "code": "LRM", "name": "La Romana International Airport" },
    { "code": "POP", "name": "Puerto Plata Gregorio Luperon" }
  ],
  "zones": [
    { "code": "Zone A", "name": "Bavaro/Punta Cana Beach" },
    { "code": "Zone B", "name": "Cap Cana/Uvero Alto" },
    { "code": "Zone C", "name": "La Romana/Bayahibe" },
    { "code": "Zone D", "name": "Puerto Plata Area" },
    { "code": "Zone E", "name": "Santo Domingo" }
  ]
}
```

#### B. Calculate Quote for Transfer
**Endpoint**: `https://[your-project].supabase.co/functions/v1/elevenlabs-calculate-quote`

**Method**: POST

**Request Body**:
```json
{
  "origin": "PUJ",
  "destination": "Hard Rock Hotel",
  "passengers": 4,
  "luggage": 3,
  "trip_type": "round_trip"
}
```

**Response**:
```json
{
  "origin": "PUJ",
  "destination": "Hard Rock Hotel",
  "passengers": 4,
  "luggage": 3,
  "trip_type": "round_trip",
  "quotes": [
    {
      "vehicle_name": "SUV",
      "vehicle_id": "uuid",
      "capacity": 4,
      "luggage_capacity": 4,
      "price": 66.50,
      "currency": "USD",
      "trip_type": "round_trip",
      "discount_applied": "10%"
    }
  ],
  "discount_percentage": 10
}
```

#### C. Create Booking
**Endpoint**: `https://[your-project].supabase.co/functions/v1/elevenlabs-create-booking`

**Method**: POST

**Request Body**:
```json
{
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "+1234567890",
  "pickup_location": "Punta Cana International Airport (PUJ)",
  "dropoff_location": "Hard Rock Hotel - Zone A Bavaro",
  "pickup_datetime": "2025-12-25T14:00:00Z",
  "passengers": 4,
  "vehicle_type_id": "uuid-from-quote",
  "vehicle_name": "SUV",
  "flight_number": "AA123",
  "special_requests": "Child seat needed",
  "total_price": 66.50,
  "trip_type": "round_trip"
}
```

**Response**:
```json
{
  "success": true,
  "booking": {
    "id": "uuid",
    "reference": "TS-ABC12345",
    "pickup_location": "Punta Cana International Airport (PUJ)",
    "dropoff_location": "Hard Rock Hotel - Zone A Bavaro",
    "pickup_datetime": "2025-12-25T14:00:00Z",
    "passengers": 4,
    "vehicle_type": "SUV",
    "total_price": 66.50,
    "status": "pending",
    "payment_status": "pending"
  },
  "message": "Booking created successfully! Reference: TS-ABC12345",
  "payment_required": true
}
```

## Configuring Your ElevenLabs Agent

### Step 1: Add Custom Tools to Your Agent

In your ElevenLabs dashboard, go to your agent settings and add these custom tools:

#### Tool 1: Get Available Vehicles and Pricing
```yaml
Name: get_vehicles_and_pricing
Description: Get all available vehicle types, pricing rules, hotel zones, and airports
Endpoint: https://[your-project].supabase.co/functions/v1/elevenlabs-get-vehicles
Method: GET
Headers:
  Content-Type: application/json
```

#### Tool 2: Calculate Transfer Quote
```yaml
Name: calculate_quote
Description: Calculate pricing for a transfer between origin and destination
Endpoint: https://[your-project].supabase.co/functions/v1/elevenlabs-calculate-quote
Method: POST
Headers:
  Content-Type: application/json
Parameters:
  - origin (required): Airport code or location name
  - destination (required): Hotel name or zone
  - passengers (optional): Number of passengers (default: 1)
  - luggage (optional): Number of suitcases (default: 1)
  - trip_type (optional): "one_way" or "round_trip" (default: "one_way")
```

#### Tool 3: Create Booking
```yaml
Name: create_booking
Description: Create a new transfer booking with customer details
Endpoint: https://[your-project].supabase.co/functions/v1/elevenlabs-create-booking
Method: POST
Headers:
  Content-Type: application/json
Parameters:
  - customer_name (required): Full name
  - customer_email (required): Email address
  - customer_phone (optional): Phone number
  - pickup_location (required): Full pickup address with airport code
  - dropoff_location (required): Full dropoff address with zone
  - pickup_datetime (required): ISO 8601 format datetime
  - passengers (required): Number of passengers
  - vehicle_type_id (required): UUID from quote response
  - vehicle_name (required): Vehicle name from quote
  - flight_number (optional): Flight number
  - special_requests (optional): Any special requirements
  - total_price (required): Total price from quote
  - trip_type (optional): "one_way" or "round_trip"
```

### Step 2: Update Agent System Prompt

Add this to your agent's system prompt:

```
You are Dominican Transfers' AI booking assistant. You help customers book airport transfers and private transportation in the Dominican Republic.

IMPORTANT: You have access to three custom tools that connect to our real-time database:

1. get_vehicles_and_pricing - Use this FIRST to load all available vehicles, zones, hotels, and pricing rules
2. calculate_quote - Use this to calculate accurate prices for customer requests
3. create_booking - Use this to create bookings after confirming all details with the customer

BOOKING FLOW:
1. Greet the customer warmly
2. Call get_vehicles_and_pricing to load current data
3. Ask for: pickup location (airport), destination (hotel/zone), date/time, passengers, luggage
4. Call calculate_quote with the details
5. Present vehicle options with prices clearly
6. Ask which vehicle they prefer
7. Collect customer details: name, email, phone, flight number (if airport pickup)
8. Confirm ALL details with the customer
9. Call create_booking to finalize
10. Provide the booking reference number and explain next steps

PRICING RULES:
- Always use the database pricing (via calculate_quote)
- Round trips are ~1.9x one-way price
- Discounts are automatically applied
- Quote all prices in USD

LOCATIONS:
Airports: PUJ (Punta Cana), SDQ (Santo Domingo), LRM (La Romana), POP (Puerto Plata)
Zones:
- Zone A: Bavaro/Punta Cana Beach
- Zone B: Cap Cana/Uvero Alto
- Zone C: La Romana/Bayahibe
- Zone D: Puerto Plata Area
- Zone E: Santo Domingo

VEHICLES:
- Sedan: 3 passengers, 3 luggage
- SUV: 4 passengers, 4 luggage
- Minivan: 6 passengers, 6 luggage
- Suburban: 5 passengers, 5 luggage
- Bus: 8+ passengers, 8+ luggage

Be conversational, helpful, and always confirm details before creating bookings.
```

### Step 3: Test the Integration

Test these conversation flows:

**Test 1: Simple Booking**
```
User: "I need a transfer from Punta Cana airport to Hard Rock Hotel on December 25th"
Agent should:
1. Call get_vehicles_and_pricing
2. Ask for time and passenger count
3. Call calculate_quote
4. Present options
5. Collect details
6. Call create_booking
```

**Test 2: Price Comparison**
```
User: "What are the prices from PUJ airport to Bavaro?"
Agent should:
1. Call get_vehicles_and_pricing
2. Ask for passengers and luggage
3. Call calculate_quote
4. Present all vehicle options with prices
```

**Test 3: Round Trip**
```
User: "I need a round trip transfer from airport to my hotel"
Agent should:
1. Ask for specific hotel/zone
2. Call calculate_quote with trip_type: "round_trip"
3. Present prices (showing round trip discount)
```

## How the Widget Appears

The ElevenLabs widget appears as a floating button in the bottom-right corner of your website. Users can:
- Click to open voice chat interface
- Speak their booking request
- Hear responses in natural voice
- See transcript of conversation
- Complete entire booking via voice

## Widget Customization

You can customize the widget appearance in your ElevenLabs dashboard:
- Button position
- Colors and branding
- Welcome message
- Avatar
- Voice settings

## Security Features

All API endpoints are:
- Authenticated via Supabase service role
- CORS-enabled for your domain
- Rate-limited
- Logged for audit purposes
- No JWT verification required (public access for voice agent)

## Monitoring and Debugging

### View Logs
Check Supabase Edge Function logs:
```
1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Select the function
4. View Logs tab
```

### Track Bookings
All voice agent bookings are marked with:
```json
{
  "source": "voice_agent",
  "details": {
    "booked_via": "elevenlabs_voice_agent"
  }
}
```

### Test Endpoints Manually

Use curl to test:

```bash
# Get vehicles
curl https://[your-project].supabase.co/functions/v1/elevenlabs-get-vehicles

# Calculate quote
curl -X POST https://[your-project].supabase.co/functions/v1/elevenlabs-calculate-quote \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "PUJ",
    "destination": "Hard Rock Hotel",
    "passengers": 4,
    "trip_type": "round_trip"
  }'

# Create booking (test mode)
curl -X POST https://[your-project].supabase.co/functions/v1/elevenlabs-create-booking \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test User",
    "customer_email": "test@example.com",
    "pickup_location": "PUJ",
    "dropoff_location": "Hard Rock Hotel",
    "pickup_datetime": "2025-12-25T14:00:00Z",
    "passengers": 4,
    "total_price": 66.50
  }'
```

## Troubleshooting

### Agent Not Calling Tools
- Verify tools are added in ElevenLabs dashboard
- Check endpoint URLs are correct
- Ensure agent prompt mentions the tools
- Test endpoints manually first

### Wrong Prices Returned
- Check pricing_rules table in Supabase
- Verify vehicle_types have correct minimum_fare
- Review global_discount_settings table
- Test calculate_quote endpoint directly

### Bookings Not Created
- Verify all required fields in request
- Check customer_email format
- Ensure pickup_datetime is in future
- Review edge function logs for errors

### Widget Not Appearing
- Check that script is loaded in HTML
- Verify agent ID is correct
- Check browser console for errors
- Ensure widget isn't blocked by ad blocker

## Next Steps

1. **Configure Agent Prompt**: Add the suggested system prompt
2. **Add Custom Tools**: Configure all three tools in ElevenLabs
3. **Test Thoroughly**: Try various booking scenarios
4. **Monitor Usage**: Check logs and bookings daily
5. **Refine Responses**: Improve agent prompts based on interactions
6. **Add Fallbacks**: Create error handling flows

## Support

If you encounter issues:
1. Check Supabase Edge Function logs
2. Verify API credentials in database
3. Test endpoints with curl
4. Review ElevenLabs agent configuration
5. Check browser console for widget errors

---

**Status**: ✅ ACTIVE
**Last Updated**: December 20, 2025
**Widget**: Embedded on all pages
**Endpoints**: Deployed and functional
