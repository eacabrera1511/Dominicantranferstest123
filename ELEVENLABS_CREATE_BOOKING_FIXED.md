# ElevenLabs create_booking Tool - Complete Format

## Date: December 21, 2024

## Problem Solved

Your `create_booking` JSON was missing ElevenLabs-specific fields that are required in their full format:
- `value_type` on each property
- `dynamic_variable`
- `constant_value`
- `enum`
- `is_system_provided`
- `value_type` on request_body_schema
- Top-level fields like `assignments`, `tool_call_sound`, etc.

## Fixed File Ready

**Download page:** `public/elevenlabs-create-booking-download.html`

**JSON file:** `public/elevenlabs-create-booking-full-format.json`

## Key Fixes Applied

### 1. Added ElevenLabs-Required Fields to Each Property

```json
{
  "id": "customer_name",
  "type": "string",
  "value_type": "llm_prompt",           // ✅ Added
  "description": "Full name...",
  "dynamic_variable": "",               // ✅ Added
  "constant_value": "",                 // ✅ Added
  "enum": null,                         // ✅ Added
  "is_system_provided": false,          // ✅ Added
  "required": true
}
```

### 2. Fixed Required vs Optional Fields

**REQUIRED fields (7):**
- ✅ `customer_name`
- ✅ `customer_email`
- ✅ `pickup_location`
- ✅ `dropoff_location`
- ✅ `pickup_datetime`
- ✅ `vehicle_name`
- ✅ `total_price`
- ✅ `trip_type`
- ✅ `source` (constant value)

**OPTIONAL fields (5):**
- ❌ `customer_phone` - optional
- ❌ `passengers` - optional (defaults to 1)
- ❌ `vehicle_type_id` - optional
- ❌ `flight_number` - optional (only for airports)
- ❌ `special_requests` - optional

### 3. Constant Value for Source

```json
{
  "id": "source",
  "type": "string",
  "value_type": "constant",              // ✅ Changed from llm_prompt
  "constant_value": "elevenlabs_voice_agent",  // ✅ Auto-filled
  "required": true
}
```

### 4. Added Schema-Level Fields

```json
"request_body_schema": {
  "id": "body",
  "type": "object",
  "value_type": "llm_prompt",           // ✅ Added
  "description": "...",
  "properties": [...],
  "required": false
}
```

### 5. Added Top-Level Fields

```json
{
  "type": "webhook",
  "name": "create_booking",
  "assignments": [],                     // ✅ Added
  "tool_call_sound": null,               // ✅ Added
  "tool_call_sound_behavior": "auto",    // ✅ Added
  "dynamic_variables": {                 // ✅ Added
    "dynamic_variable_placeholders": {}
  }
}
```

## Database Verification

✅ **Bookings table:** All fields exist
✅ **Edge function:** Working correctly
✅ **Stripe integration:** Configured
✅ **Email automation:** Active

The edge function at `elevenlabs-create-booking` expects these exact fields and handles:
1. Creating booking in database
2. Creating/updating customer record
3. Generating Stripe checkout session
4. Sending confirmation email with payment link
5. Returning booking reference and payment URL

## Tool Properties (14 Fields)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| customer_name | string | ✅ | Full name |
| customer_email | string | ✅ | Email for payment link |
| customer_phone | string | ❌ | Optional phone |
| pickup_location | string | ✅ | Pickup address |
| dropoff_location | string | ✅ | Dropoff address |
| pickup_datetime | string | ✅ | ISO 8601 datetime |
| passengers | number | ❌ | Optional (default: 1) |
| vehicle_type_id | string | ❌ | Optional vehicle ID |
| vehicle_name | string | ✅ | Vehicle name |
| flight_number | string | ❌ | Optional if airport |
| special_requests | string | ❌ | Optional notes |
| total_price | number | ✅ | Price from quote |
| trip_type | string | ✅ | 'one_way' or 'round_trip' |
| source | string | ✅ | Constant: 'elevenlabs_voice_agent' |

## What Happens When Tool is Called

1. ✅ **Validates** required fields
2. ✅ **Creates** booking record in database
3. ✅ **Updates/Creates** customer profile
4. ✅ **Generates** Stripe payment checkout link
5. ✅ **Sends** confirmation email with payment link
6. ✅ **Returns** booking reference + payment URL to voice agent

## Response Format

The edge function returns:

```json
{
  "success": true,
  "booking": {
    "id": "uuid",
    "reference": "TS-ABC12345",
    "pickup_location": "...",
    "dropoff_location": "...",
    "pickup_datetime": "...",
    "passengers": 4,
    "vehicle_type": "SUV",
    "total_price": 75.00,
    "status": "pending",
    "payment_status": "pending"
  },
  "message": "Booking TS-ABC12345 created successfully!",
  "payment_url": "https://checkout.stripe.com/...",
  "stripe_session_id": "cs_...",
  "payment_link_generated": true
}
```

## How to Use

### 1. Open Download Page

Open: `public/elevenlabs-create-booking-download.html`

### 2. Copy or Download

- Click **"Copy to Clipboard"** for instant copy
- Or click **"Download JSON"** to save file

### 3. Paste into ElevenLabs

1. Go to **ElevenLabs Dashboard**
2. Navigate to **Tools**
3. Click **"Add Tool"** or **"Edit Tool"**
4. Select **"Custom Webhook"**
5. **Paste** the entire JSON
6. Click **"Save"**

### 4. Test

Say to your voice agent:
```
"Hi, I need a transfer from Punta Cana Airport to Hard Rock Hotel
for 4 people. We're arriving tomorrow at 3 PM on flight AA1234.
My name is John Smith and my email is john@example.com."
```

Expected flow:
1. ✅ Agent collects all information
2. ✅ Agent confirms details with customer
3. ✅ Agent calls `calculate_quote` to get price
4. ✅ Agent confirms final price
5. ✅ Agent calls `create_booking`
6. ✅ Agent tells customer: "Booking created! Check your email for payment link"

## Troubleshooting

### If validation still fails:

1. **Check URL:** Make sure the URL is exactly:
   ```
   https://gwlaxeonvfywhecwtupv.supabase.co/functions/v1/elevenlabs-create-booking
   ```

2. **Verify JSON:** Make sure entire JSON is pasted (including brackets)

3. **Check required fields:** All properties marked `required: true` must be there

4. **Copy exactly:** Use the download page's copy button to avoid formatting issues

## Test Commands

### Simple test:
```
"I need a transfer for 2 people from PUJ Airport to Bavaro tomorrow at 2 PM"
```

### Complete test:
```
"I need a transfer from Punta Cana Airport to Dreams Macao Beach Resort.
We have 4 passengers arriving December 25th at 3:30 PM on American Airlines
flight 1234. I'd like an SUV. My name is John Smith, email john@example.com,
phone +1-555-123-4567."
```

## Build Status

✅ Project builds successfully
✅ All TypeScript types valid
✅ No compilation errors

## Summary

The `create_booking` tool now has the complete ElevenLabs format with all required fields including `value_type`, `dynamic_variable`, `constant_value`, `enum`, and `is_system_provided` on each property. The database connection is verified, and the edge function is ready to handle bookings.

Your voice agent can now:
1. Collect booking information through natural conversation
2. Call this tool to create the booking
3. Generate Stripe payment links automatically
4. Send confirmation emails
5. Track everything in your CRM

Ready to paste into ElevenLabs!
