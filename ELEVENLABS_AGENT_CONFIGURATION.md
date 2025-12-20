# ElevenLabs Voice Agent Configuration Guide

**Agent ID**: `agent_4201kcxcxbege73tvy22a28rt04n`
**Setup Date**: December 20, 2025

## Step-by-Step Configuration

### 1. Access Your Agent Settings

1. Go to: https://elevenlabs.io/app/conversational-ai
2. Find your agent: `agent_4201kcxcxbege73tvy22a28rt04n`
3. Click to open the agent settings
4. Look for one of these sections:
   - **"Custom Tools"** (most common)
   - **"Client Tools"**
   - **"Actions"**
   - **"Functions"**
   - **"Webhooks"**

---

## Tool #1: Get Vehicle Information

**Purpose**: Loads all vehicle types, pricing rules, and location data

### Configuration in ElevenLabs:

**Tool Name**: `get_vehicle_info`

**Description**:
```
Get available vehicle types, pricing rules, airports, and hotel zones. Use this first to understand what vehicles are available and their capabilities.
```

**Method**: GET

**URL**:
```
https://gwlaxeonvfywhecwtupv.supabase.co/functions/v1/elevenlabs-get-vehicles
```

**Parameters**: None (this is a GET request with no parameters)

**When to Use**:
- At the start of a conversation when customer asks about vehicles
- Before calculating quotes to know what's available
- When customer asks "what vehicles do you have?"

---

## Tool #2: Calculate Quote

**Purpose**: Calculates accurate pricing for any route with automatic discounts

### Configuration in ElevenLabs:

**Tool Name**: `calculate_quote`

**Description**:
```
Calculate accurate pricing for a transfer. Returns vehicle options sorted by price with current discounts applied. Requires origin, destination, and trip details.
```

**Method**: POST

**URL**:
```
https://gwlaxeonvfywhecwtupv.supabase.co/functions/v1/elevenlabs-calculate-quote
```

**Parameters (JSON Schema)**:
```json
{
  "type": "object",
  "required": ["origin", "destination"],
  "properties": {
    "origin": {
      "type": "string",
      "description": "Pickup location (e.g., 'PUJ Airport', 'Bavaro Beach', 'Cap Cana')"
    },
    "destination": {
      "type": "string",
      "description": "Drop-off location (e.g., 'Bavaro', 'La Romana', 'Santo Domingo')"
    },
    "passengers": {
      "type": "integer",
      "description": "Number of passengers (default: 1)"
    },
    "luggage": {
      "type": "integer",
      "description": "Number of luggage pieces (default: 1)"
    },
    "trip_type": {
      "type": "string",
      "enum": ["one_way", "round_trip"],
      "description": "Type of trip (default: 'one_way')"
    }
  }
}
```

**Example Request Body**:
```json
{
  "origin": "PUJ Airport",
  "destination": "Bavaro",
  "passengers": 4,
  "luggage": 4,
  "trip_type": "one_way"
}
```

**When to Use**:
- After customer provides pickup and dropoff locations
- When customer asks "how much does it cost?"
- Before creating a booking to confirm pricing

---

## Tool #3: Create Booking

**Purpose**: Creates the booking in Supabase and returns confirmation

### Configuration in ElevenLabs:

**Tool Name**: `create_booking`

**Description**:
```
Create a confirmed booking in the system. Collects customer details, updates CRM records, generates booking reference. Only call this after getting customer confirmation and all required details.
```

**Method**: POST

**URL**:
```
https://gwlaxeonvfywhecwtupv.supabase.co/functions/v1/elevenlabs-create-booking
```

**Parameters (JSON Schema)**:
```json
{
  "type": "object",
  "required": ["customer_email", "pickup_location", "dropoff_location", "pickup_datetime"],
  "properties": {
    "customer_name": {
      "type": "string",
      "description": "Customer's full name"
    },
    "customer_email": {
      "type": "string",
      "format": "email",
      "description": "Customer's email address (REQUIRED)"
    },
    "customer_phone": {
      "type": "string",
      "description": "Customer's phone number with country code (e.g., +1234567890)"
    },
    "pickup_location": {
      "type": "string",
      "description": "Full pickup location/address (REQUIRED)"
    },
    "dropoff_location": {
      "type": "string",
      "description": "Full dropoff location/address (REQUIRED)"
    },
    "pickup_datetime": {
      "type": "string",
      "format": "date-time",
      "description": "Pickup date and time in ISO 8601 format (REQUIRED, e.g., '2025-12-25T14:30:00Z')"
    },
    "passengers": {
      "type": "integer",
      "description": "Number of passengers (default: 1)"
    },
    "vehicle_type_id": {
      "type": "string",
      "format": "uuid",
      "description": "ID of the selected vehicle type from get_vehicle_info"
    },
    "vehicle_name": {
      "type": "string",
      "description": "Name of the selected vehicle (e.g., 'Sedan', 'SUV')"
    },
    "flight_number": {
      "type": "string",
      "description": "Flight number if applicable (optional)"
    },
    "special_requests": {
      "type": "string",
      "description": "Any special requests from customer (optional)"
    },
    "total_price": {
      "type": "number",
      "description": "Total price from calculate_quote (REQUIRED)"
    },
    "trip_type": {
      "type": "string",
      "enum": ["one_way", "round_trip"],
      "description": "Type of trip (default: 'one_way')"
    }
  }
}
```

**Example Request Body**:
```json
{
  "customer_name": "John Smith",
  "customer_email": "john@example.com",
  "customer_phone": "+18095551234",
  "pickup_location": "Punta Cana International Airport",
  "dropoff_location": "Hard Rock Hotel Punta Cana",
  "pickup_datetime": "2025-12-25T14:30:00Z",
  "passengers": 4,
  "vehicle_type_id": "uuid-from-get-vehicles",
  "vehicle_name": "SUV",
  "flight_number": "AA1234",
  "special_requests": "Need child seat",
  "total_price": 75.50,
  "trip_type": "one_way"
}
```

**When to Use**:
- Only after customer confirms they want to book
- After collecting all required information
- When customer says "yes, book it" or similar confirmation

---

## Suggested Agent Instructions

Add this to your ElevenLabs agent's system prompt:

```
You are a friendly booking agent for Dominican Transfers, a premium airport transfer service in the Dominican Republic.

BOOKING FLOW:
1. Greet the customer warmly
2. Ask for pickup location (airport/hotel)
3. Ask for destination
4. Ask for date and time
5. Ask for number of passengers and luggage
6. Use calculate_quote to get pricing
7. Present the vehicle options with prices
8. Ask which vehicle they prefer
9. Collect customer details (name, email, phone)
10. Confirm all details with customer
11. Use create_booking to finalize
12. Provide booking reference and payment link

ALWAYS:
- Use get_vehicle_info at the start to know what's available
- Use calculate_quote before presenting prices
- Confirm all details before calling create_booking
- Mark all bookings as source: "voice_agent"
- Be conversational and friendly
- Speak clearly and confirm spelling of names/emails

NEVER:
- Create a booking without customer confirmation
- Guess at prices - always use calculate_quote
- Skip collecting required information (email, phone, pickup datetime)
```

---

## Testing Your Configuration

After adding all 3 tools, test by saying:

**Test 1 - Get Vehicles**:
> "What vehicles do you have available?"

**Test 2 - Calculate Quote**:
> "How much for a transfer from PUJ Airport to Bavaro for 4 people?"

**Test 3 - Complete Booking**:
> "I need a transfer from PUJ Airport to Hard Rock Hotel on December 25th at 2pm for 4 passengers. My name is John Smith, email john@test.com, phone +18095551234"

---

## Troubleshooting

### Tools Not Appearing
- Make sure you're in the correct agent (agent_4201kcxcxbege73tvy22a28rt04n)
- Try refreshing the page
- Check if your ElevenLabs plan supports custom tools

### Tool Fails to Execute
- Verify the URL is correct (check for typos)
- Ensure CORS headers are enabled (they are)
- Check that parameters match the schema exactly

### Booking Not Created
- Verify customer_email is provided and valid
- Check pickup_datetime is in ISO 8601 format
- Ensure total_price is a number, not a string
- Confirm pickup_location and dropoff_location are provided

---

## Support

If you need help:
1. Check the Supabase logs: https://supabase.com/dashboard/project/gwlaxeonvfywhecwtupv/logs/edge-functions
2. Test endpoints directly using the test files in `/public/`
3. Review chat transcripts in Admin > Chat Transcripts

All bookings created via voice are automatically marked as `source: "voice_agent"` for tracking!
