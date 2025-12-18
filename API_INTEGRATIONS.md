# API Integrations Guide

## Overview

The CRM includes a built-in API integration manager that allows you to easily configure third-party services. This guide covers how to obtain and configure API keys for each supported integration.

## Accessing the API Integrations Manager

1. Log in to the Admin Portal
2. Navigate to **API Integrations** from the sidebar
3. Click **Configure** on any integration to add your API keys

## Supported Integrations

### 1. Google Maps API

**Purpose**: Calculate accurate distances, durations, and routes for pricing quotes

**Features Enabled**:
- Accurate distance calculation for pricing
- Driving duration estimates
- Multi-stop route optimization
- Geocoding for address validation

**How to Get API Key**:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Distance Matrix API
   - Geocoding API
   - Directions API
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the API key

**Configuration**:
- **API Key**: Paste your Google Maps API key
- **Status**: Toggle to "Active" when ready

**Pricing**: Pay-as-you-go, $5 per 1,000 requests for Distance Matrix API

**Test**: Click "Test Connection" to verify the API key works

---

### 2. FlightStats API (Premium Flight Tracking)

**Purpose**: Real-time flight tracking and status updates

**Features Enabled**:
- Real-time flight status
- Delay notifications
- Arrival/departure times
- Automated pickup time adjustments

**How to Get API Key**:

1. Go to [FlightStats Developer Portal](https://developer.flightstats.com/)
2. Create an account
3. Subscribe to a plan (starts at $500/month)
4. Navigate to **My Applications**
5. Create a new application
6. Copy both **App ID** and **App Key**

**Configuration**:
- **API Key**: Your App ID
- **API Secret**: Your App Key
- **Status**: Toggle to "Active" when ready

**Pricing**: Starts at $500/month for basic plan

**Test**: Click "Test Connection" to verify credentials

---

### 3. Aviation Stack API (Budget Flight Tracking Alternative)

**Purpose**: Basic flight tracking at lower cost

**Features Enabled**:
- Flight status lookups
- Basic delay information
- Scheduled vs actual times

**How to Get API Key**:

1. Go to [Aviation Stack](https://aviationstack.com/)
2. Sign up for a free or paid account
3. Navigate to **Dashboard**
4. Copy your API Access Key

**Configuration**:
- **API Key**: Your Aviation Stack access key
- **Status**: Toggle to "Active" when ready

**Pricing**:
- Free: 100 requests/month
- Basic: $9.99/month (500 requests)
- Professional: $49.99/month (10,000 requests)

**Note**: We recommend Aviation Stack for budget-conscious operations. FlightStats is more reliable but expensive.

**Test**: Click "Test Connection" to verify the API key

---

### 4. Twilio SMS

**Purpose**: Send SMS notifications to customers and drivers

**Features Enabled**:
- Booking confirmations via SMS
- Driver assignment notifications
- Arrival notifications
- Payment receipts

**How to Get API Credentials**:

1. Go to [Twilio Console](https://www.twilio.com/console)
2. Sign up for an account
3. Navigate to **Account Info**
4. Copy your **Account SID** and **Auth Token**
5. Purchase a phone number in **Phone Numbers** → **Buy a Number**

**Configuration**:
- **API Key**: Your Account SID
- **API Secret**: Your Auth Token
- **Phone Number**: Your Twilio phone number (format: +1234567890)
- **Status**: Toggle to "Active" when ready

**Pricing**: Pay-as-you-go, $0.0079 per SMS in the US

**Test**: Click "Test Connection" to verify credentials

---

### 5. Stripe Payments

**Purpose**: Process credit card payments

**Features Enabled**:
- Credit card processing
- Refunds
- Payment receipts
- PCI-compliant card storage

**How to Get API Key**:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign up for an account
3. Navigate to **Developers** → **API Keys**
4. Copy your **Secret Key** (starts with `sk_live_` or `sk_test_`)

**Configuration**:
- **API Key**: Your Stripe secret key
- **Status**: Toggle to "Active" when ready

**Important**: Start with Test Mode keys (`sk_test_`) for development. Switch to Live Mode keys (`sk_live_`) for production.

**Pricing**: 2.9% + $0.30 per successful card charge

**Test**: Click "Test Connection" to verify the API key

---

### 6. SendGrid Email

**Purpose**: Send transactional emails

**Features Enabled**:
- Booking confirmations
- Invoice delivery
- Password resets
- Custom notifications

**How to Get API Key**:

1. Go to [SendGrid](https://sendgrid.com/)
2. Sign up for an account
3. Navigate to **Settings** → **API Keys**
4. Click **Create API Key**
5. Select **Full Access** permissions
6. Copy the API key (shown only once)

**Configuration**:
- **API Key**: Your SendGrid API key
- **Status**: Toggle to "Active" when ready

**Pricing**:
- Free: 100 emails/day
- Essentials: $19.95/month (50,000 emails)
- Pro: $89.95/month (100,000 emails)

**Test**: Click "Test Connection" to verify the API key

---

## How API Integrations Work

### Automatic Fallback

All integrations are designed with graceful degradation:

1. **Google Maps API**: If not configured, the system uses straight-line distance estimates with a 1.2x multiplier for road distance
2. **Flight Tracking**: If not configured, flight numbers are stored but not actively tracked
3. **SMS**: If not configured, notifications are logged but not sent
4. **Email**: If not configured, emails are logged but not sent
5. **Stripe**: If not configured, payment processing is manual (cash, check, corporate billing)

### Testing Connections

After configuring any integration:

1. Click the **Test Connection** button
2. The system performs a real API call to verify credentials
3. Results are displayed immediately
4. Last test time and status are saved for monitoring

### Security

- All API keys are stored encrypted in the database
- Keys are never exposed in client-side code
- Only authenticated admin users can view or modify API keys
- Test calls are rate-limited to prevent abuse

---

## Recommended Setup Priority

### Phase 1: Essential (Start Here)
1. **SendGrid** - Email notifications are critical for customer communication
2. **Google Maps** - Accurate pricing depends on real distance calculations

### Phase 2: Enhanced Customer Experience
3. **Twilio** - SMS notifications improve customer satisfaction
4. **Stripe** - Online payment processing increases conversion rates

### Phase 3: Advanced Features
5. **Aviation Stack** - Budget-friendly flight tracking (or FlightStats for premium)

---

## Cost Estimation

Here's what you can expect to spend monthly based on volume:

### Small Operation (500 bookings/month)
- Google Maps: $5-10
- SendGrid: Free tier (100 emails/day)
- Twilio: $4 (500 SMS)
- Stripe: Transaction fees only (2.9% + $0.30)
- Aviation Stack: $9.99 (or skip for now)
- **Total Fixed Costs**: ~$20-25/month + transaction fees

### Medium Operation (2,000 bookings/month)
- Google Maps: $20-40
- SendGrid: $19.95 (Essentials plan)
- Twilio: $16 (2,000 SMS)
- Stripe: Transaction fees only
- Aviation Stack: $49.99 (Professional)
- **Total Fixed Costs**: ~$105-125/month + transaction fees

### Large Operation (10,000 bookings/month)
- Google Maps: $100-200
- SendGrid: $89.95 (Pro plan)
- Twilio: $80 (10,000 SMS)
- Stripe: Transaction fees only
- FlightStats: $500 (more reliable)
- **Total Fixed Costs**: ~$770-870/month + transaction fees

---

## Troubleshooting

### "Test Connection Failed"

**Google Maps**:
- Verify the API key is correct
- Check that Distance Matrix API is enabled in Google Cloud Console
- Ensure billing is enabled on your Google Cloud account

**FlightStats**:
- Verify both App ID and App Key are entered correctly
- Check your subscription is active
- Confirm your IP is not blocked

**Aviation Stack**:
- Verify the API key is correct
- Check you haven't exceeded your monthly quota
- Free tier has limited requests (100/month)

**Twilio**:
- Verify Account SID and Auth Token match
- Check your Twilio account is active
- Ensure you have a purchased phone number

**Stripe**:
- Verify you're using the Secret Key (not Publishable Key)
- Check the key starts with `sk_` not `pk_`
- Ensure the key matches your environment (test vs live)

**SendGrid**:
- Verify the API key is correct (shown only once during creation)
- Check the API key has full access permissions
- Confirm your SendGrid account is verified

### "Integration not working in production"

1. Check the integration is toggled to **Active**
2. Verify the last test was successful
3. Check the Supabase Edge Function logs for errors
4. Ensure you're using production keys (not test keys)

### "Costs are too high"

1. **Google Maps**: Cache common routes in your database to reduce API calls
2. **Twilio**: Use email for non-urgent notifications
3. **SendGrid**: Clean your email list to avoid bounces
4. **Flight Tracking**: Only track flights within 24 hours of pickup

---

## API Integration Roadmap

### Coming Soon
- QuickBooks Online (accounting sync)
- Xero (accounting alternative)
- Mailchimp (marketing automation)
- Slack (team notifications)

### Under Consideration
- Zapier (workflow automation)
- Google Calendar sync
- Calendly integration
- DocuSign (contract signing)

---

## Support

If you need help configuring any integration:

1. Check the provider's documentation (links provided above)
2. Review the test error messages in the admin panel
3. Contact our support team with your error details

**Important**: Never share your API keys with anyone, including support staff. We only need to know the error messages, not your actual credentials.
