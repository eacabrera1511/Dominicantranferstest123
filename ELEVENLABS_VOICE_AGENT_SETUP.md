# ElevenLabs Voice Agent Setup Guide

## Overview

This guide will help you configure your ElevenLabs Voice Agent to work with your booking system, allowing customers to make bookings via voice that integrate with your database pricing, routes, vehicles, Stripe payment system, and email confirmations.

## Agent Configuration

### Agent ID
```
agent_9201kcymyrn0er6v2a20wfr3by49
```

## Step 1: Configure Custom Tools in ElevenLabs Dashboard

Go to your ElevenLabs Agent settings at https://elevenlabs.io/app/conversational-ai and add the following custom tools:

### Tool 1: Get Available Vehicles

**Tool Name:** `get_vehicles`

**Description:**
```
Get available vehicles, pricing information, hotel zones, and airport codes for the Dominican Republic transfer service. Use this to provide customers with vehicle options and location information.
```

**Endpoint URL:**
```
https://[YOUR_SUPABASE_PROJECT].supabase.co/functions/v1/elevenlabs-get-vehicles
```

**Method:** `GET`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Parameters:** None required

**Response Example:**
```json
{
  "vehicle_types": [
    {
      "id": 1,
      "name": "Sedan",
      "passenger_capacity": 4,
      "luggage_capacity": 2,
      "minimum_fare": 50
    }
  ],
  "airports": [
    {"code": "PUJ", "name": "Punta Cana International Airport"},
    {"code": "SDQ", "name": "Santo Domingo Las Americas"}
  ],
  "zones": [
    {"code": "Zone A", "name": "Bavaro/Punta Cana Beach"}
  ]
}
```

---

### Tool 2: Calculate Price Quote

**Tool Name:** `calculate_quote`

**Description:**
```
Calculate accurate price quotes for transfers based on origin, destination, number of passengers, luggage count, and trip type (one-way or round-trip). Returns all suitable vehicle options with real-time pricing from the database, including any active discounts.
```

**Endpoint URL:**
```
https://[YOUR_SUPABASE_PROJECT].supabase.co/functions/v1/elevenlabs-calculate-quote
```

**Method:** `POST`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Parameters:**
```json
{
  "origin": {
    "type": "string",
    "description": "Pickup location (e.g., 'PUJ Airport' or 'Zone A Bavaro')",
    "required": true
  },
  "destination": {
    "type": "string",
    "description": "Dropoff location (e.g., 'Zone A Bavaro' or 'SDQ Airport')",
    "required": true
  },
  "passengers": {
    "type": "number",
    "description": "Number of passengers",
    "required": false,
    "default": 1
  },
  "luggage": {
    "type": "number",
    "description": "Number of luggage pieces",
    "required": false,
    "default": 1
  },
  "trip_type": {
    "type": "string",
    "description": "Type of trip: 'one_way' or 'round_trip'",
    "required": false,
    "default": "one_way"
  }
}
```

**Response Example:**
```json
{
  "origin": "PUJ Airport",
  "destination": "Zone A Bavaro",
  "passengers": 2,
  "luggage": 2,
  "trip_type": "one_way",
  "discount_percentage": 15,
  "quotes": [
    {
      "vehicle_name": "Sedan",
      "vehicle_id": 1,
      "capacity": 4,
      "luggage_capacity": 2,
      "price": 42.50,
      "currency": "USD",
      "trip_type": "one_way",
      "discount_applied": "15%"
    }
  ]
}
```

---

### Tool 3: Create Booking

**Tool Name:** `create_booking`

**Description:**
```
Create a new transfer booking in the system. This will automatically:
1. Save the booking to the database
2. Create a Stripe payment checkout link
3. Send a confirmation email with the payment link to the customer
4. Return the booking reference and payment URL

IMPORTANT: Only call this tool after you have:
- Confirmed ALL booking details with the customer
- Received confirmation from the customer to proceed with the booking
- Collected: name, email, phone, pickup location, dropoff location, date/time, vehicle selection
```

**Endpoint URL:**
```
https://[YOUR_SUPABASE_PROJECT].supabase.co/functions/v1/elevenlabs-create-booking
```

**Method:** `POST`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Parameters:**
```json
{
  "customer_name": {
    "type": "string",
    "description": "Full name of the customer",
    "required": true
  },
  "customer_email": {
    "type": "string",
    "description": "Email address of the customer",
    "required": true
  },
  "customer_phone": {
    "type": "string",
    "description": "Phone number of the customer (with country code)",
    "required": false
  },
  "pickup_location": {
    "type": "string",
    "description": "Pickup location (e.g., 'PUJ Airport Terminal A')",
    "required": true
  },
  "dropoff_location": {
    "type": "string",
    "description": "Dropoff location (e.g., 'Hard Rock Hotel Punta Cana')",
    "required": true
  },
  "pickup_datetime": {
    "type": "string",
    "description": "ISO 8601 format datetime for pickup (e.g., '2024-12-25T14:30:00Z')",
    "required": true
  },
  "passengers": {
    "type": "number",
    "description": "Number of passengers",
    "required": false,
    "default": 1
  },
  "vehicle_type_id": {
    "type": "number",
    "description": "ID of the selected vehicle type from get_vehicles",
    "required": true
  },
  "vehicle_name": {
    "type": "string",
    "description": "Name of the selected vehicle (e.g., 'Sedan')",
    "required": true
  },
  "flight_number": {
    "type": "string",
    "description": "Flight number if pickup is from airport",
    "required": false
  },
  "special_requests": {
    "type": "string",
    "description": "Any special requests or notes from the customer",
    "required": false
  },
  "total_price": {
    "type": "number",
    "description": "Total price from the quote (in USD)",
    "required": true
  },
  "trip_type": {
    "type": "string",
    "description": "Type of trip: 'one_way' or 'round_trip'",
    "required": false,
    "default": "one_way"
  },
  "source": {
    "type": "string",
    "description": "Booking source identifier",
    "required": false,
    "default": "voice_agent"
  }
}
```

**Response Example:**
```json
{
  "success": true,
  "booking": {
    "id": 123,
    "reference": "BKG-2024-001",
    "pickup_location": "PUJ Airport",
    "dropoff_location": "Hard Rock Hotel",
    "pickup_datetime": "2024-12-25T14:30:00Z",
    "passengers": 2,
    "vehicle_type": "Sedan",
    "total_price": 50,
    "status": "pending",
    "payment_status": "pending"
  },
  "message": "Booking BKG-2024-001 created successfully! A confirmation email with payment link has been sent to customer@email.com",
  "payment_required": true,
  "payment_url": "https://checkout.stripe.com/...",
  "checkout_url": "https://checkout.stripe.com/..."
}
```

---

## Step 2: Configure Agent System Prompt

Add this to your ElevenLabs Agent system prompt:

```
You are a professional transfer booking agent for Dominican Transfers, specializing in airport and hotel transfers in the Dominican Republic. Your goal is to help customers book reliable, comfortable transfers with excellent service.

IMPORTANT BOOKING FLOW:
1. Greet the customer warmly and ask how you can help
2. Gather transfer details conversationally:
   - Where are they traveling FROM (airport code or hotel zone)
   - Where are they traveling TO (hotel or airport)
   - Date and time of pickup
   - Number of passengers
   - Number of luggage pieces
   - One-way or round-trip transfer

3. Use get_vehicles to understand available options and locations
4. Use calculate_quote to get accurate pricing based on their requirements
5. Present vehicle options with prices, explaining capacity and features
6. Once they select a vehicle, collect:
   - Full name
   - Email address
   - Phone number (with country code)
   - Flight number (if airport pickup)
   - Any special requests

7. CONFIRM ALL DETAILS with the customer before booking:
   - Read back the complete booking details
   - Confirm the total price
   - Wait for explicit confirmation to proceed

8. Only after customer confirmation, use create_booking to finalize
9. Inform customer that:
   - Booking confirmation email has been sent
   - Payment link is included in the email
   - They can complete payment securely via Stripe
   - Quote the booking reference number

CONVERSATION GUIDELINES:
- Be friendly, professional, and reassuring
- Speak naturally and conversationally
- Ask one question at a time to avoid overwhelming customers
- Confirm understanding by repeating key details
- If customer asks about pricing, always use calculate_quote for accuracy
- Never guess or make up prices - always use the quote tool
- If uncertain about locations, use get_vehicles to check valid options
- Emphasize safety, reliability, and professional service

LOCATION KNOWLEDGE:
- PUJ = Punta Cana Airport
- SDQ = Santo Domingo Airport
- LRM = La Romana Airport
- POP = Puerto Plata Airport
- Zone A = Bavaro/Punta Cana Beach resorts
- Zone B = Cap Cana/Uvero Alto
- Zone C = La Romana/Bayahibe
- Zone D = Puerto Plata Area
- Zone E = Santo Domingo

PRICING:
- All prices are in USD
- Round-trip transfers get approximately 10% discount (applied automatically)
- Active promotional discounts are applied automatically
- Be transparent about all pricing

AFTER BOOKING:
- Provide booking reference number
- Confirm email sent with payment link
- Remind customer to check spam folder if email not received
- Offer to answer any questions about their transfer
- Thank them for choosing Dominican Transfers

Remember: Always prioritize customer satisfaction and accuracy. If you're unsure about something, it's better to check using the available tools than to guess.
```

## Step 3: Test Your Agent

### Test Conversation Flow:

1. **Customer:** "I need a transfer from PUJ airport to my hotel in Bavaro"
   - **Agent should:** Ask for date, time, passengers, and luggage

2. **Customer provides details**
   - **Agent should:** Call `get_vehicles` and `calculate_quote`
   - **Agent should:** Present vehicle options with prices

3. **Customer selects vehicle**
   - **Agent should:** Collect name, email, phone, flight number
   - **Agent should:** Confirm all details

4. **Customer confirms**
   - **Agent should:** Call `create_booking`
   - **Agent should:** Provide booking reference and confirm email sent

## Step 4: Monitor and Optimize

### Check Booking Success:
- Log into your Admin Dashboard
- Navigate to Bookings section
- Filter by source: "voice_agent"
- Verify bookings are being created correctly

### Check Email Delivery:
- Admin Dashboard → Email Logs
- Verify confirmation emails are being sent

### Check Payment Flow:
- Verify Stripe checkout links are working
- Monitor payment completion rate

## Environment Variables Required

Make sure these are set in your Supabase Edge Functions:

```
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
STRIPE_SECRET_KEY=[your-stripe-secret-key]
RESEND_API_KEY=[your-resend-api-key]
WEBSITE_URL=https://dominicantransfers.com
```

## Troubleshooting

### Agent not getting vehicles:
- Check that `elevenlabs-get-vehicles` function is deployed
- Verify the endpoint URL in agent settings
- Check that vehicle_types table has active vehicles

### Quotes returning empty:
- Ensure pricing_rules table has routes configured
- Check that origin/destination match format in database
- Verify vehicle capacities meet passenger/luggage requirements

### Bookings not creating:
- Check `elevenlabs-create-booking` function logs
- Verify all required fields are being passed
- Check bookings table permissions

### Emails not sending:
- Verify RESEND_API_KEY is configured
- Check email_logs table for error messages
- Verify sender email is verified in Resend

### Stripe checkout not working:
- Verify STRIPE_SECRET_KEY is correct
- Check that Stripe is in live mode (not test mode)
- Verify webhook endpoint is configured

## Support

For technical support or questions about the voice booking system:
- Check Admin Dashboard → Troubleshooting section
- Review booking and email logs
- Contact your development team

## Success Metrics to Monitor

1. **Booking Completion Rate:** % of conversations that result in bookings
2. **Email Delivery Rate:** % of confirmation emails successfully delivered
3. **Payment Completion Rate:** % of bookings that complete payment
4. **Average Conversation Length:** Time from start to booking completion
5. **Customer Satisfaction:** Monitor for repeated customers

---

**Last Updated:** December 20, 2024
**Version:** 1.0
**Agent ID:** agent_9201kcymyrn0er6v2a20wfr3by49
