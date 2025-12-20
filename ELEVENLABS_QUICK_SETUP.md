# ElevenLabs Quick Setup - Copy & Paste Guide

Open this file while configuring your agent in ElevenLabs dashboard.

---

## 🔧 TOOL 1: GET VEHICLES

**Name**: `get_vehicle_info`

**Description**:
```
Get available vehicle types, pricing rules, airports, and hotel zones. Use this first to understand what vehicles are available.
```

**Method**: `GET`

**URL**:
```
https://gwlaxeonvfywhecwtupv.supabase.co/functions/v1/elevenlabs-get-vehicles
```

**Parameters**: None

---

## 💰 TOOL 2: CALCULATE QUOTE

**Name**: `calculate_quote`

**Description**:
```
Calculate accurate pricing for a transfer. Returns vehicle options sorted by price with discounts applied. Requires origin and destination.
```

**Method**: `POST`

**URL**:
```
https://gwlaxeonvfywhecwtupv.supabase.co/functions/v1/elevenlabs-calculate-quote
```

**Parameters** (paste this JSON):
```json
{
  "type": "object",
  "required": ["origin", "destination"],
  "properties": {
    "origin": {
      "type": "string",
      "description": "Pickup location (e.g., 'PUJ Airport', 'Bavaro Beach')"
    },
    "destination": {
      "type": "string",
      "description": "Drop-off location (e.g., 'Bavaro', 'La Romana')"
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

---

## ✅ TOOL 3: CREATE BOOKING

**Name**: `create_booking`

**Description**:
```
Create a confirmed booking. Collects customer details, updates CRM, generates booking reference. Only call after customer confirmation.
```

**Method**: `POST`

**URL**:
```
https://gwlaxeonvfywhecwtupv.supabase.co/functions/v1/elevenlabs-create-booking
```

**Parameters** (paste this JSON):
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
      "description": "Customer's phone number with country code"
    },
    "pickup_location": {
      "type": "string",
      "description": "Full pickup location (REQUIRED)"
    },
    "dropoff_location": {
      "type": "string",
      "description": "Full dropoff location (REQUIRED)"
    },
    "pickup_datetime": {
      "type": "string",
      "format": "date-time",
      "description": "Pickup date/time ISO format (REQUIRED, e.g., '2025-12-25T14:30:00Z')"
    },
    "passengers": {
      "type": "integer",
      "description": "Number of passengers"
    },
    "vehicle_type_id": {
      "type": "string",
      "format": "uuid",
      "description": "Vehicle ID from get_vehicle_info"
    },
    "vehicle_name": {
      "type": "string",
      "description": "Vehicle name (e.g., 'Sedan', 'SUV')"
    },
    "flight_number": {
      "type": "string",
      "description": "Flight number if applicable"
    },
    "special_requests": {
      "type": "string",
      "description": "Any special requests"
    },
    "total_price": {
      "type": "number",
      "description": "Total price from calculate_quote"
    },
    "trip_type": {
      "type": "string",
      "enum": ["one_way", "round_trip"],
      "description": "Type of trip"
    }
  }
}
```

---

## 📝 AGENT SYSTEM PROMPT

Paste this into your agent's instructions:

```
You are a friendly booking agent for Dominican Transfers, a premium airport transfer service in the Dominican Republic.

BOOKING FLOW:
1. Greet warmly
2. Ask: pickup location
3. Ask: destination
4. Ask: date and time
5. Ask: passengers and luggage
6. Use calculate_quote to get pricing
7. Present vehicle options with prices
8. Ask which vehicle they prefer
9. Collect: name, email, phone
10. Confirm all details
11. Use create_booking to finalize
12. Provide booking reference

ALWAYS:
- Use get_vehicle_info at start
- Use calculate_quote before pricing
- Confirm before create_booking
- Be conversational and friendly
- Confirm spelling of names/emails

NEVER:
- Book without confirmation
- Guess prices
- Skip required info (email, phone, datetime)
```

---

## ✅ QUICK TEST

After setup, say: **"I need a transfer from PUJ Airport to Bavaro tomorrow at 2pm for 2 people"**

Expected: Agent should ask for your details, calculate pricing, and create booking.

---

## 🆘 NEED HELP?

- **Agent ID**: `agent_4201kcxcxbege73tvy22a28rt04n`
- **Dashboard**: https://elevenlabs.io/app/conversational-ai
- **Endpoint Base**: `https://gwlaxeonvfywhecwtupv.supabase.co/functions/v1/`

All set! Your voice agent will now handle complete bookings automatically! 🎉
