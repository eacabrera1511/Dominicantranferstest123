# ElevenLabs Voice Booking - Quick Reference

## What's Been Set Up

### 1. Voice Booking Button in Menu
- Located in the contact menu (phone icon in header)
- Opens ElevenLabs voice widget in a modal overlay
- Professional design with purple gradient styling

### 2. Three Custom API Endpoints for ElevenLabs

All endpoints are ready and deployed. You need to configure them in your ElevenLabs agent dashboard:

#### **Get Vehicles** (GET)
```
https://[YOUR_PROJECT].supabase.co/functions/v1/elevenlabs-get-vehicles
```
Returns all available vehicles, pricing rules, zones, and airports from your database.

#### **Calculate Quote** (POST)
```
https://[YOUR_PROJECT].supabase.co/functions/v1/elevenlabs-calculate-quote
```
Calculates accurate pricing based on route, passengers, luggage, and trip type.
Includes real-time discount application from your database.

#### **Create Booking** (POST)
```
https://[YOUR_PROJECT].supabase.co/functions/v1/elevenlabs-create-booking
```
Creates booking, generates Stripe payment link, and sends confirmation email automatically.

### 3. Integration Features

✅ **Database Integration:**
- Uses your pricing rules from database
- Filters vehicles by capacity
- Applies active global discounts automatically

✅ **Stripe Payment:**
- Automatically creates checkout session
- Adds payment URL to booking
- Tracks payment status

✅ **Email Confirmation:**
- Sends booking confirmation immediately
- Includes payment link
- Uses your Resend email system

## Next Steps - REQUIRED CONFIGURATION

### Step 1: Add Custom Tools in ElevenLabs Dashboard

1. Go to https://elevenlabs.io/app/conversational-ai
2. Open your agent: `agent_9201kcymyrn0er6v2a20wfr3by49`
3. Navigate to "Custom Tools" or "Functions" section
4. Add three tools (see `ELEVENLABS_VOICE_AGENT_SETUP.md` for detailed configuration):
   - `get_vehicles`
   - `calculate_quote`
   - `create_booking`

### Step 2: Update Agent System Prompt

Copy the system prompt from `ELEVENLABS_VOICE_AGENT_SETUP.md` and paste it into your ElevenLabs agent settings.

The prompt includes:
- Professional greeting and tone
- Step-by-step booking flow
- Location knowledge
- Pricing transparency
- Error handling
- Customer confirmation requirements

### Step 3: Replace Placeholders

In the endpoint URLs, replace `[YOUR_PROJECT]` with your actual Supabase project URL.

Example:
```
https://abcdefghijk.supabase.co/functions/v1/elevenlabs-get-vehicles
```

## How It Works - User Flow

1. **Customer clicks** Voice Booking button in menu
2. **ElevenLabs widget opens** - customer speaks naturally
3. **Agent gathers info:**
   - Pickup location (airport/hotel)
   - Dropoff location
   - Date & time
   - Passengers & luggage
   - Trip type (one-way/round-trip)

4. **Agent calls** `get_vehicles` to understand available options
5. **Agent calls** `calculate_quote` with customer requirements
6. **Agent presents** vehicle options with accurate prices
7. **Customer selects** preferred vehicle
8. **Agent collects** contact information:
   - Full name
   - Email address
   - Phone number
   - Flight number (if applicable)
   - Special requests

9. **Agent confirms** ALL details with customer
10. **Customer approves** - Agent calls `create_booking`
11. **System automatically:**
    - Creates booking in database
    - Generates Stripe checkout link
    - Sends confirmation email with payment link
    - Returns booking reference to agent

12. **Agent provides** booking reference and confirms email sent
13. **Customer receives** email with secure payment link
14. **Customer completes** payment via Stripe checkout

## Testing Your Setup

### Test Conversation:
```
You: "I need a transfer from Punta Cana airport to my hotel"
Agent: "I'd be happy to help! Which hotel are you staying at?"
You: "Hard Rock Hotel in Bavaro"
Agent: "Great! When do you need the pickup?"
You: "December 25th at 2 PM"
Agent: "How many passengers?"
You: "2 adults and 2 children"
Agent: "And how many bags?"
You: "4 large suitcases"
Agent: [Calls calculate_quote]
Agent: "I have several options for you..."
[continues with booking flow]
```

### Verify in Admin Dashboard:
1. Go to Admin Dashboard
2. Click "Bookings"
3. Filter by source: "voice_agent"
4. Check booking details are correct
5. Verify email was sent (Email Logs section)
6. Test payment link works

## Monitoring Success

Track these metrics in your Admin Dashboard:

📊 **Bookings:** Filter by source "voice_agent" to see voice bookings
📧 **Email Logs:** Verify confirmation emails are sending
💳 **Payment Status:** Monitor Stripe payment completion
👥 **Customers:** See new customers from voice bookings
📈 **Analytics:** Track conversion rates

## Troubleshooting

**Widget not loading?**
- Check that ElevenLabs script is loaded in index.html
- Verify agent ID is correct: `agent_9201kcymyrn0er6v2a20wfr3by49`

**Agent not creating bookings?**
- Verify all three custom tools are configured
- Check endpoint URLs are correct
- Ensure tools have correct parameters configured

**Emails not sending?**
- Check RESEND_API_KEY is set in Supabase
- Verify sender email is verified in Resend
- Check email_logs table for errors

**Payments not working?**
- Verify STRIPE_SECRET_KEY is configured
- Check Stripe is in correct mode (live/test)
- Ensure webhook is configured for payment updates

## Configuration Checklist

- [ ] Voice booking button added to menu ✅
- [ ] Edge Functions deployed ✅
- [ ] Add custom tools in ElevenLabs dashboard
- [ ] Update agent system prompt
- [ ] Replace URL placeholders with your Supabase project
- [ ] Test full booking flow
- [ ] Verify email delivery
- [ ] Test payment flow
- [ ] Monitor first bookings in Admin Dashboard

## Files Created/Modified

📄 **Frontend:**
- `src/App.tsx` - Added voice booking button and modal

📄 **Backend:**
- `supabase/functions/elevenlabs-get-vehicles/index.ts` - Get vehicles & pricing
- `supabase/functions/elevenlabs-calculate-quote/index.ts` - Calculate quotes
- `supabase/functions/elevenlabs-create-booking/index.ts` - Create bookings + payment + email

📄 **Documentation:**
- `ELEVENLABS_VOICE_AGENT_SETUP.md` - Complete setup guide
- `ELEVENLABS_QUICK_REFERENCE.md` - This file

## Support

Need help? Check:
1. `ELEVENLABS_VOICE_AGENT_SETUP.md` for detailed setup instructions
2. Admin Dashboard → Troubleshooting section
3. Supabase Edge Function logs
4. ElevenLabs agent conversation logs

---

**Agent ID:** agent_9201kcymyrn0er6v2a20wfr3by49
**Status:** Ready to configure
**Next Action:** Add custom tools in ElevenLabs dashboard
