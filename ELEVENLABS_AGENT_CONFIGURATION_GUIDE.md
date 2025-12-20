# ElevenLabs Agent Configuration - Step-by-Step Guide

**Agent ID:** agent_9201kcymyrn0er6v2a20wfr3by49

## Before You Start

You need your Supabase Project URL. Find it at:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy "Project URL" (looks like: `https://abcdefghijk.supabase.co`)

---

## Navigation Steps

1. Go to https://elevenlabs.io/app/conversational-ai
2. Find and click on your agent: **agent_9201kcymyrn0er6v2a20wfr3by49**
3. Click on **"Tools"** tab or section
4. You'll see the form you showed in your screenshot
5. Follow the configurations below for each of the 3 tools

---

# TOOL 1: Get Vehicles

Click **"Add Tool"** or **"Create New Tool"** button

## Configuration Fields:

### Name
```
get_vehicles
```

### Description
```
Get available vehicles, pricing information, hotel zones, and airport codes for the Dominican Republic transfer service. Use this to provide customers with vehicle options and location information. Call this tool at the start of conversations to understand what vehicles and locations are available.
```

### Method
```
GET
```
(Select GET from the dropdown)

### URL
```
https://YOUR_PROJECT_URL_HERE.supabase.co/functions/v1/elevenlabs-get-vehicles
```
**⚠️ IMPORTANT:** Replace `YOUR_PROJECT_URL_HERE.supabase.co` with your actual Supabase Project URL

Example: `https://abcdefghijk.supabase.co/functions/v1/elevenlabs-get-vehicles`

### Response timeout (seconds)
```
20
```
(Leave as default 20 seconds)

### Disable interruptions
```
☐ Unchecked
```
(Leave unchecked - customers can interrupt)

### Pre-tool speech
```
Auto
```
(Select "Auto" or leave default)

### Execution mode
```
Parallel
```
(Select "Parallel" if available, otherwise "Sequential")

### Tool call sound
```
None
```

### Authentication
```
None
```
(Leave empty - no authentication needed)

### Headers
```
No headers needed
```
(Do not add any headers)

### Path parameters
```
None
```
(Leave empty)

### Query parameters
```
None
```
(Leave empty - GET requests don't need parameters)

### Dynamic Variables
```
None
```
(Leave empty)

### Dynamic Variable Assignments
```
None
```
(Leave empty)

**Click "Save" or "Create Tool"**

---

# TOOL 2: Calculate Quote

Click **"Add Tool"** or **"Create New Tool"** button again

## Configuration Fields:

### Name
```
calculate_quote
```

### Description
```
Calculate accurate price quotes for transfers based on origin, destination, number of passengers, luggage count, and trip type (one-way or round-trip). Returns all suitable vehicle options with real-time pricing from the database, including any active discounts. Always use this tool to get accurate pricing - never guess prices.
```

### Method
```
POST
```
(Select POST from the dropdown)

### URL
```
https://YOUR_PROJECT_URL_HERE.supabase.co/functions/v1/elevenlabs-calculate-quote
```
**⚠️ IMPORTANT:** Replace `YOUR_PROJECT_URL_HERE.supabase.co` with your actual Supabase Project URL

Example: `https://abcdefghijk.supabase.co/functions/v1/elevenlabs-calculate-quote`

### Response timeout (seconds)
```
20
```

### Disable interruptions
```
☐ Unchecked
```

### Pre-tool speech
```
Auto
```

### Execution mode
```
Sequential
```

### Tool call sound
```
None
```

### Authentication
```
None
```

### Headers
Click **"Add header"** once and add:

**Header 1:**
- Key: `Content-Type`
- Value: `application/json`

### Path parameters
```
None
```

### Query parameters
**⚠️ IMPORTANT:** You need to add these as **BODY parameters** (not query parameters) since this is a POST request.

If the interface shows "Body parameters" or "Request body", configure these:

**Click "Add param" for each parameter below:**

**Parameter 1:**
- Name: `origin`
- Type: `string`
- Description: `Pickup location (e.g., 'PUJ Airport' or 'Zone A Bavaro')`
- Required: `✓ Yes`

**Parameter 2:**
- Name: `destination`
- Type: `string`
- Description: `Dropoff location (e.g., 'Zone A Bavaro' or 'SDQ Airport')`
- Required: `✓ Yes`

**Parameter 3:**
- Name: `passengers`
- Type: `number`
- Description: `Number of passengers`
- Required: `☐ No`
- Default: `1`

**Parameter 4:**
- Name: `luggage`
- Type: `number`
- Description: `Number of luggage pieces`
- Required: `☐ No`
- Default: `1`

**Parameter 5:**
- Name: `trip_type`
- Type: `string`
- Description: `Type of trip: 'one_way' or 'round_trip'`
- Required: `☐ No`
- Default: `one_way`

### Dynamic Variables
```
None
```

### Dynamic Variable Assignments
```
None
```

**Click "Save" or "Create Tool"**

---

# TOOL 3: Create Booking

Click **"Add Tool"** or **"Create New Tool"** button again

## Configuration Fields:

### Name
```
create_booking
```

### Description
```
Create a new transfer booking in the system. This will automatically create the booking in the database, generate a Stripe payment checkout link, and send a confirmation email with the payment link to the customer. CRITICAL: Only call this tool after you have confirmed ALL booking details with the customer and received explicit confirmation to proceed. Required information: customer name, email, phone, pickup location, dropoff location, date and time, vehicle selection, and total price.
```

### Method
```
POST
```
(Select POST from the dropdown)

### URL
```
https://YOUR_PROJECT_URL_HERE.supabase.co/functions/v1/elevenlabs-create-booking
```
**⚠️ IMPORTANT:** Replace `YOUR_PROJECT_URL_HERE.supabase.co` with your actual Supabase Project URL

Example: `https://abcdefghijk.supabase.co/functions/v1/elevenlabs-create-booking`

### Response timeout (seconds)
```
30
```
(Use 30 seconds since this tool creates booking + payment + sends email)

### Disable interruptions
```
☑ Checked
```
**⚠️ IMPORTANT:** Check this box - customers should NOT interrupt while booking is being created

### Pre-tool speech
```
Manual
```
(Select "Manual" so agent can say "Let me create your booking now...")

### Execution mode
```
Sequential
```

### Tool call sound
```
None
```

### Authentication
```
None
```

### Headers
Click **"Add header"** once and add:

**Header 1:**
- Key: `Content-Type`
- Value: `application/json`

### Path parameters
```
None
```

### Query parameters / Body parameters
**⚠️ IMPORTANT:** Add these as **BODY parameters** (not query parameters) since this is a POST request.

**Click "Add param" for each parameter below:**

**Parameter 1:**
- Name: `customer_name`
- Type: `string`
- Description: `Full name of the customer`
- Required: `✓ Yes`

**Parameter 2:**
- Name: `customer_email`
- Type: `string`
- Description: `Email address of the customer (must be valid email format)`
- Required: `✓ Yes`

**Parameter 3:**
- Name: `customer_phone`
- Type: `string`
- Description: `Phone number with country code (e.g., +1234567890)`
- Required: `☐ No`

**Parameter 4:**
- Name: `pickup_location`
- Type: `string`
- Description: `Detailed pickup location (e.g., 'PUJ Airport Terminal A')`
- Required: `✓ Yes`

**Parameter 5:**
- Name: `dropoff_location`
- Type: `string`
- Description: `Detailed dropoff location (e.g., 'Hard Rock Hotel Punta Cana')`
- Required: `✓ Yes`

**Parameter 6:**
- Name: `pickup_datetime`
- Type: `string`
- Description: `ISO 8601 datetime for pickup (e.g., '2024-12-25T14:30:00Z')`
- Required: `✓ Yes`

**Parameter 7:**
- Name: `passengers`
- Type: `number`
- Description: `Number of passengers`
- Required: `☐ No`
- Default: `1`

**Parameter 8:**
- Name: `vehicle_type_id`
- Type: `number`
- Description: `ID of the selected vehicle type from get_vehicles tool response`
- Required: `✓ Yes`

**Parameter 9:**
- Name: `vehicle_name`
- Type: `string`
- Description: `Name of the selected vehicle (e.g., 'Sedan', 'SUV')`
- Required: `✓ Yes`

**Parameter 10:**
- Name: `flight_number`
- Type: `string`
- Description: `Flight number if pickup is from airport`
- Required: `☐ No`

**Parameter 11:**
- Name: `special_requests`
- Type: `string`
- Description: `Any special requests or notes from customer`
- Required: `☐ No`

**Parameter 12:**
- Name: `total_price`
- Type: `number`
- Description: `Total price in USD from the quote (e.g., 50.00)`
- Required: `✓ Yes`

**Parameter 13:**
- Name: `trip_type`
- Type: `string`
- Description: `Type of trip: 'one_way' or 'round_trip'`
- Required: `☐ No`
- Default: `one_way`

**Parameter 14:**
- Name: `source`
- Type: `string`
- Description: `Booking source identifier`
- Required: `☐ No`
- Default: `voice_agent`

### Dynamic Variables
```
None
```

### Dynamic Variable Assignments
```
None
```

**Click "Save" or "Create Tool"**

---

# SYSTEM PROMPT CONFIGURATION

After configuring all three tools, you need to update your agent's system prompt.

## Steps:

1. In your agent dashboard, find **"System Prompt"** or **"Instructions"** section
2. Clear any existing prompt (or append to it if you want to keep something)
3. Copy and paste the following prompt:

```
You are a professional transfer booking agent for Dominican Transfers, specializing in airport and hotel transfers in the Dominican Republic. Your goal is to help customers book reliable, comfortable transfers with excellent service.

IMPORTANT BOOKING FLOW:

1. GREET warmly and ask how you can help with their transfer needs

2. GATHER transfer details conversationally (ask ONE question at a time):
   - Where are they traveling FROM? (airport code or hotel/zone)
   - Where are they going TO? (hotel or airport)
   - What date and time do they need pickup?
   - How many passengers?
   - How many pieces of luggage?
   - Do they need one-way or round-trip transfer?

3. USE TOOLS IN ORDER:
   - First: Call get_vehicles to understand available options and valid locations
   - Second: Call calculate_quote with all the details collected above
   - Present the vehicle options with prices clearly

4. COLLECT CUSTOMER INFORMATION after they select a vehicle:
   - Full name (first and last)
   - Email address (verify it's correct)
   - Phone number with country code (e.g., +1 555 1234567)
   - Flight number (if airport pickup - this is important!)
   - Any special requests (child seats, extra luggage, etc.)

5. CONFIRM EVERYTHING before booking:
   - Read back: pickup location, dropoff location, date/time
   - Confirm: number of passengers, luggage count
   - State: selected vehicle and total price
   - Ask: "Does everything look correct? Shall I proceed with the booking?"
   - WAIT for explicit "yes" or confirmation

6. CREATE BOOKING only after customer confirms:
   - Call create_booking with ALL collected information
   - The system will automatically:
     * Save booking to database
     * Generate secure Stripe payment link
     * Send confirmation email with payment link
   - Provide the booking reference number
   - Confirm email was sent to their address

7. AFTER BOOKING:
   - Give them the booking reference number clearly (spell it if needed)
   - Confirm they'll receive email with payment link
   - Remind them to check spam folder if email doesn't arrive
   - Ask if they have any questions
   - Thank them for choosing Dominican Transfers

CONVERSATION GUIDELINES:
- Be warm, friendly, and professional
- Speak naturally and conversationally
- Ask ONE question at a time - don't overwhelm
- Listen carefully and confirm you understood correctly
- If customer provides multiple details at once, acknowledge all of them
- Never guess prices - always use calculate_quote tool
- Never guess locations - use get_vehicles to check valid options
- Be patient with customers who need time to provide information
- If customer seems confused, offer to explain the process

LOCATION KNOWLEDGE (from Dominican Republic):
Airports:
- PUJ or Punta Cana = Punta Cana International Airport
- SDQ or Santo Domingo = Las Americas International Airport
- LRM or La Romana = La Romana International Airport
- POP or Puerto Plata = Gregorio Luperon International Airport

Hotel Zones:
- Zone A = Bavaro and Punta Cana Beach resorts (most popular)
- Zone B = Cap Cana and Uvero Alto (luxury resorts)
- Zone C = La Romana and Bayahibe
- Zone D = Puerto Plata Area
- Zone E = Santo Domingo city

PRICING TRANSPARENCY:
- All prices are in US Dollars (USD)
- Round-trip transfers automatically get a discount (approximately 10% off)
- Any promotional discounts are applied automatically
- The price you quote from calculate_quote is the final price
- Be clear about what's included: professional driver, vehicle, tolls

VEHICLE OPTIONS (you'll see these from get_vehicles):
- Sedan: Up to 4 passengers, 2-3 bags - economical choice
- SUV: Up to 6 passengers, 4-5 bags - comfortable for families
- Van: Up to 8 passengers, 6-8 bags - great for groups
- Luxury vehicles also available

IMPORTANT REMINDERS:
- NEVER create a booking without customer confirmation
- ALWAYS use calculate_quote before giving a price
- ALWAYS collect email address (needed for confirmation and payment)
- ALWAYS get flight number for airport pickups (critical for tracking)
- If customer asks about payment: "You'll receive a secure payment link via email after booking confirmation. You can pay by credit card through our secure Stripe checkout."
- If customer asks about cancellation: "We have a flexible cancellation policy. Details will be in your confirmation email."

HANDLING ISSUES:
- If tools fail or timeout: Apologize and ask customer to try again or call us
- If customer provides invalid info: Politely ask them to clarify
- If uncertain about location: Use get_vehicles to check valid options
- If customer wants special arrangements: Note in special_requests field

YOUR TONE:
- Professional but friendly
- Helpful and patient
- Clear and concise
- Reassuring about the service quality
- Enthusiastic about helping them have a great trip

Remember: You represent Dominican Transfers. Every interaction should leave customers feeling confident, excited about their trip, and satisfied with the booking experience. Quality service starts with quality conversation!
```

4. **Click "Save"** or **"Update Prompt"**

---

# VERIFICATION CHECKLIST

After configuration, verify everything:

## ✓ Tool Configuration Checklist:

- [ ] Tool 1: get_vehicles (GET) - configured and saved
- [ ] Tool 2: calculate_quote (POST) - configured with all 5 parameters
- [ ] Tool 3: create_booking (POST) - configured with all 14 parameters
- [ ] All URLs use YOUR actual Supabase project URL (not placeholder)
- [ ] System prompt updated and saved
- [ ] Content-Type header added to POST tools

## ✓ Test Your Agent:

1. Start a conversation with your agent
2. Say: "I need a transfer from Punta Cana airport to my hotel"
3. Agent should:
   - Ask follow-up questions naturally
   - Call get_vehicles tool
   - Call calculate_quote tool after gathering info
   - Present vehicle options with prices
   - Collect your contact information
   - Confirm all details before booking
   - Call create_booking only after your confirmation

4. Check in Admin Dashboard:
   - Go to Bookings section
   - Filter by source: "voice_agent"
   - Verify booking was created correctly
   - Check Email Logs to see if email was sent

---

# TROUBLESHOOTING

## "Tool failed to execute" error:

**Check:**
1. Did you replace the placeholder URL with your actual Supabase URL?
2. Is your Supabase project active and running?
3. Are the Edge Functions deployed? (They should be already)

## Agent not calling tools:

**Check:**
1. Are tool descriptions clear and detailed?
2. Is the system prompt instructing the agent to use tools?
3. Try being more explicit: "Get me a quote for..." instead of "How much is..."

## Bookings not creating:

**Check:**
1. Are all required parameters marked as "Required"?
2. Is customer_email in valid email format?
3. Is pickup_datetime in ISO 8601 format?
4. Is vehicle_type_id a number (not text)?

## Emails not sending:

**Check:**
1. Is RESEND_API_KEY configured in Supabase? (It should be)
2. Is sender email verified in Resend?
3. Check Admin Dashboard → Email Logs for errors

## Payment links not working:

**Check:**
1. Is STRIPE_SECRET_KEY configured in Supabase? (It should be)
2. Is Stripe in the correct mode (test vs live)?
3. Check booking record for stripe_session_id

---

# SUPPORT

If you need help:

1. Check the full setup guide: `ELEVENLABS_VOICE_AGENT_SETUP.md`
2. Check Admin Dashboard → Troubleshooting section
3. Review Supabase Edge Function logs
4. Check ElevenLabs conversation logs in agent dashboard

---

**Configuration Date:** December 20, 2024
**Agent ID:** agent_9201kcymyrn0er6v2a20wfr3by49
**Version:** 1.0

✨ **Once configured, your voice booking system will be fully operational!** ✨
