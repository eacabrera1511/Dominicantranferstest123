# ElevenLabs Voice Agent - Corrected JSON Configurations

## Date: December 21, 2024

**COPY AND PASTE THESE EXACT CONFIGURATIONS INTO YOUR ELEVENLABS AGENT**

---

## 🔧 What Was Fixed

### 1. **calculate_quote** - MAJOR FIX
- **Bug:** Simple string matching couldn't find correct pricing rules
- **Fix:** Now uses hotel_zones database to properly identify zones and match pricing rules
- **Result:** Accurate pricing for all hotels and zones
- **Added:** origin_zone and destination_zone to response for debugging

### 2. **create_booking** - MINOR FIX
- **Bug:** flight_number marked as required (should be optional)
- **Fix:** Changed to optional in JSON config below
- **Result:** Can create bookings for non-airport transfers

### 3. **get_vehicle_info** - NO CHANGES
- **Status:** Already working correctly
- Returns all vehicles, pricing rules, hotel zones, and airports

---

## Tool #1: get_vehicle_info

**Purpose:** Get available vehicles, pricing info, hotel zones, and airports

**Copy this JSON:**

```json
{
  "type": "webhook",
  "name": "get_vehicle_info",
  "description": "Get available vehicles, pricing information, hotel zones, and airport codes for the Dominican Republic transfer service. Use this to provide customers with vehicle options and location information. Call this tool at the start of conversations to understand what vehicles and locations are available.",
  "disable_interruptions": false,
  "force_pre_tool_speech": "auto",
  "assignments": [],
  "tool_call_sound": null,
  "tool_call_sound_behavior": "auto",
  "execution_mode": "immediate",
  "api_schema": {
    "url": "https://gwlaxeonvfywhecwtupv.supabase.co/functions/v1/elevenlabs-get-vehicles",
    "method": "GET",
    "path_params_schema": [],
    "query_params_schema": [],
    "request_body_schema": null,
    "request_headers": [],
    "auth_connection": null
  },
  "response_timeout_secs": 20,
  "dynamic_variables": {
    "dynamic_variable_placeholders": {}
  }
}
```

---

## Tool #2: calculate_quote ✅ FIXED

**Purpose:** Calculate accurate pricing using hotel zones and pricing rules

**What Changed:**
- Now properly identifies hotel zones from destination
- Matches pricing rules by zone, not just string matching
- Falls back to zone-based pricing if no specific hotel match
- Returns origin_zone and destination_zone for transparency

**Copy this JSON:**

```json
{
  "type": "webhook",
  "name": "calculate_quote",
  "description": "Calculate accurate price quotes for transfers based on origin, destination, number of passengers, luggage count, and trip type (one-way or round-trip). Returns all suitable vehicle options with real-time pricing from the database, including any active discounts. Always use this tool to get accurate pricing - never guess prices. The system will automatically identify hotel zones and match pricing rules.",
  "disable_interruptions": false,
  "force_pre_tool_speech": "auto",
  "assignments": [],
  "tool_call_sound": null,
  "tool_call_sound_behavior": "auto",
  "execution_mode": "immediate",
  "api_schema": {
    "url": "https://gwlaxeonvfywhecwtupv.supabase.co/functions/v1/elevenlabs-calculate-quote",
    "method": "POST",
    "path_params_schema": [],
    "query_params_schema": [],
    "request_body_schema": {
      "id": "body",
      "type": "object",
      "description": "Collect transfer booking details from the user. Extract the pickup location (origin), dropoff location (destination), number of passengers, number of luggage pieces, and trip type from the conversation. The system will automatically identify zones and pricing. Be specific with hotel names when possible.",
      "properties": [
        {
          "id": "origin",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Pickup location - be specific (e.g., 'PUJ Airport', 'Hard Rock Hotel Punta Cana', 'Dreams Cap Cana', 'Zone A Bavaro'). The system will identify the zone automatically.",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": true
        },
        {
          "id": "destination",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Dropoff location - be specific with hotel name (e.g., 'Hard Rock Hotel Punta Cana', 'Secrets Royal Beach', 'Dreams Macao Beach', 'Zone A Bavaro'). The system will identify the zone automatically.",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": true
        },
        {
          "id": "passengers",
          "type": "number",
          "value_type": "llm_prompt",
          "description": "Number of passengers (default: 1 if not mentioned)",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "luggage",
          "type": "number",
          "value_type": "llm_prompt",
          "description": "Number of luggage pieces (default: 1 if not mentioned)",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "trip_type",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Type of trip: 'one_way' or 'round_trip' (default: 'one_way' if not mentioned). Round trips are 1.9x the one-way price.",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        }
      ],
      "required": false,
      "value_type": "llm_prompt"
    },
    "request_headers": [
      {
        "type": "value",
        "name": "Content-Type",
        "value": "application/json"
      }
    ],
    "auth_connection": null
  },
  "response_timeout_secs": 20,
  "dynamic_variables": {
    "dynamic_variable_placeholders": {}
  }
}
```

---

## Tool #3: create_booking ✅ FIXED

**Purpose:** Create booking, generate Stripe payment link, send confirmation email

**What Changed:**
- flight_number changed from REQUIRED to OPTIONAL
- source field added with better description

**IMPORTANT:** Only call this after collecting ALL information and receiving customer confirmation!

**Copy this JSON:**

```json
{
  "type": "webhook",
  "name": "create_booking",
  "description": "Create a new transfer booking in the system. This will automatically: 1) Create the booking in the database, 2) Generate a Stripe payment checkout link, 3) Send a confirmation email with the payment link to the customer. CRITICAL: Only call this tool after you have confirmed ALL booking details with the customer and received explicit confirmation to proceed. Do not call this tool until the customer has agreed to the booking.",
  "disable_interruptions": true,
  "force_pre_tool_speech": "force",
  "assignments": [],
  "tool_call_sound": null,
  "tool_call_sound_behavior": "auto",
  "execution_mode": "post_tool_speech",
  "api_schema": {
    "url": "https://gwlaxeonvfywhecwtupv.supabase.co/functions/v1/elevenlabs-create-booking",
    "method": "POST",
    "path_params_schema": [],
    "query_params_schema": [],
    "request_body_schema": {
      "id": "body",
      "type": "object",
      "description": "Extract all booking information from the conversation after customer confirmation. Required: customer name, email, pickup location, dropoff location, pickup datetime, vehicle selection, total price, and trip type. Optional: phone, flight number, special requests.",
      "properties": [
        {
          "id": "customer_name",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Full name of the customer (first and last name)",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": true
        },
        {
          "id": "customer_email",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Email address of the customer (must be valid email format). The payment link and booking confirmation will be sent to this email.",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": true
        },
        {
          "id": "customer_phone",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Phone number with country code (e.g., '+1 555-123-4567'). Optional but recommended.",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "pickup_location",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Detailed pickup location (e.g., 'Punta Cana International Airport (PUJ)', 'Hard Rock Hotel Punta Cana')",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": true
        },
        {
          "id": "dropoff_location",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Detailed dropoff location (e.g., 'Dreams Cap Cana Resort', 'Santo Domingo Airport (SDQ)')",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": true
        },
        {
          "id": "pickup_datetime",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "ISO 8601 datetime for pickup (e.g., '2024-12-25T14:30:00Z'). Include timezone. Ask the customer for their arrival date and time.",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": true
        },
        {
          "id": "passengers",
          "type": "number",
          "value_type": "llm_prompt",
          "description": "Number of passengers traveling (default: 1)",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "vehicle_type_id",
          "type": "number",
          "value_type": "llm_prompt",
          "description": "ID of the selected vehicle type from calculate_quote response (e.g., vehicle_id from the quote). This is required to track which vehicle was selected.",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": true
        },
        {
          "id": "vehicle_name",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Name of the selected vehicle from the quote (e.g., 'Sedan', 'SUV', 'Minivan', 'Suburban')",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": true
        },
        {
          "id": "flight_number",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Flight number if pickup is from airport (e.g., 'AA1234', 'DL5678'). Optional - only ask if pickup is from an airport.",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "special_requests",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Any special requests, notes, or requirements from the customer (e.g., 'Need child seat', 'Wheelchair accessible', 'Extra luggage space'). Optional.",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": false
        },
        {
          "id": "total_price",
          "type": "number",
          "value_type": "llm_prompt",
          "description": "Total price in USD from the calculate_quote response (e.g., 50.00). This exact amount will be charged via Stripe.",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": true
        },
        {
          "id": "trip_type",
          "type": "string",
          "value_type": "llm_prompt",
          "description": "Type of trip: 'one_way' or 'round_trip'. Must match what was used in the quote.",
          "dynamic_variable": "",
          "constant_value": "",
          "enum": null,
          "is_system_provided": false,
          "required": true
        },
        {
          "id": "source",
          "type": "string",
          "value_type": "constant",
          "description": "Source of the booking - always set to 'elevenlabs_voice_agent'",
          "dynamic_variable": "",
          "constant_value": "elevenlabs_voice_agent",
          "enum": null,
          "is_system_provided": false,
          "required": true
        }
      ],
      "required": false,
      "value_type": "llm_prompt"
    },
    "request_headers": [
      {
        "type": "value",
        "name": "Content-Type",
        "value": "application/json"
      }
    ],
    "auth_connection": null
  },
  "response_timeout_secs": 30,
  "dynamic_variables": {
    "dynamic_variable_placeholders": {}
  }
}
```

---

## 🧪 Testing Your Agent

After updating the configurations, test with these scenarios:

### Test 1: Simple Airport Transfer
```
User: "I need a transfer from PUJ Airport to Dreams Cap Cana for 4 people"
Expected: Should calculate quote with proper zone-based pricing ($47 for sedan)
```

### Test 2: Hotel to Hotel
```
User: "Transfer from Hard Rock Punta Cana to Secrets Royal Beach, 2 passengers"
Expected: Should identify both hotels and calculate pricing
```

### Test 3: Round Trip
```
User: "Round trip from PUJ to Bavaro, 6 people with luggage"
Expected: Should calculate round trip pricing (1.9x multiplier)
```

### Test 4: Complete Booking
```
User provides: Name, email, phone, pickup time, flight number
Expected: Creates booking, generates payment link, sends email
```

---

## 📋 Booking Flow Checklist

Your agent should follow this flow:

1. ✅ **Get Info** - Call `get_vehicle_info` at start
2. ✅ **Gather Details** - Ask for: pickup, dropoff, passengers, luggage, trip type
3. ✅ **Calculate Quote** - Call `calculate_quote` with details
4. ✅ **Present Options** - Show vehicle options with prices
5. ✅ **Collect Contact** - Get name, email, phone, datetime, flight# (if airport)
6. ✅ **Confirm Everything** - Review ALL details with customer
7. ✅ **Get Explicit Approval** - "Shall I create your booking?"
8. ✅ **Create Booking** - Call `create_booking` only after confirmation
9. ✅ **Confirm Success** - Tell customer email sent with payment link

---

## 🐛 Common Issues Resolved

### Issue #1: Wrong Pricing ✅ FIXED
**Before:** Generic string matching couldn't find correct prices
**After:** Zone-based matching with hotel database lookup
**Solution:** Enhanced calculate_quote function

### Issue #2: Can't Book Without Flight Number ✅ FIXED
**Before:** flight_number was required for all bookings
**After:** flight_number is optional (only needed for airport pickups)
**Solution:** Changed field to optional in JSON config

### Issue #3: Bookings Failing Silently
**Check:** Make sure STRIPE_SECRET_KEY is configured in Supabase
**Check:** Make sure RESEND_API_KEY is configured for emails
**Check:** Verify customer_email is valid email format

---

## ✅ Verification

After applying these configs:

1. **Quote Calculation** should work for ANY hotel or zone
2. **Booking Creation** should work with or without flight number
3. **Payment Links** should be generated automatically
4. **Confirmation Emails** should be sent immediately

**All functions deployed and tested successfully!** ✅

---

## Support

If issues persist after applying these configs:

1. Check Supabase edge function logs
2. Verify environment variables are set
3. Test each endpoint individually via Postman/curl
4. Check email logs in admin dashboard

**Your voice agent is now ready for production!** 🎉
