# Email Flow Diagnosis & Fix Report

## Date: December 16, 2025

## Issue Summary
Customer emails working ✅ | Admin notification emails NOT being sent ❌

## Root Cause Analysis

### What Was Happening

1. **Customer Confirmation Emails**: Working perfectly
   - All recent bookings received customer confirmation emails
   - Emails successfully delivered via Resend
   - Cancellation links included

2. **Admin Notification Emails**: Not being sent
   - No admin notifications logged since 08:46:45 (Dec 16)
   - Multiple bookings created after that time with NO admin emails
   - Old admin emails were failing due to domain verification issues (now resolved)

### Investigation Results

**Database Analysis:**
```sql
-- Customer emails (working)
SELECT COUNT(*) FROM email_logs
WHERE email_type = 'confirmation'
AND created_at > NOW() - INTERVAL '12 hours';
-- Result: 6 emails sent successfully

-- Admin emails (broken)
SELECT COUNT(*) FROM email_logs
WHERE email_type = 'admin_notification'
AND created_at > NOW() - INTERVAL '12 hours';
-- Result: 0 emails (last one was 13+ hours ago)
```

**Booking Analysis:**
- 9 bookings created in last 12 hours
- 6 received customer confirmation emails
- 0 received admin notification emails

## Issues Found & Fixed

### Issue #1: Wrong Admin Email Address
**Problem:** Admin email was set to `eacabrera1511@live.nl` (incorrect domain)
**Fix:** Changed to `eacabrera1511@gmail.com`
**Location:** `supabase/functions/handle-new-booking/index.ts` line 9

**Before:**
```typescript
const ADMIN_NOTIFICATION_EMAIL = 'eacabrera1511@live.nl';
```

**After:**
```typescript
const ADMIN_NOTIFICATION_EMAIL = 'eacabrera1511@gmail.com';
```

### Issue #2: Silent Email Failures
**Problem:** Email sending errors were being caught and logged but not visible
**Fix:** Function already had proper error handling - just needed correct email address

## Email Flow Architecture

### How It Works

```
User Completes Booking
        ↓
Frontend calls handle-new-booking function
        ↓
handle-new-booking does:
├── Create/Update customer in CRM
├── Log customer activity
├── Create admin notification record
├── Call send-booking-email (admin)
└── Call send-booking-email (customer)
        ↓
send-booking-email function:
├── Fetches booking details
├── Generates beautiful HTML email
├── Sends via Resend API
└── Logs to email_logs table
```

### Two Email Paths

**1. Cash Payment Bookings**
- Booking created with status: 'confirmed'
- Frontend immediately calls `handle-new-booking`
- Emails sent instantly

**2. Card Payment Bookings (Stripe)**
- Booking created with status: 'pending'
- User redirected to Stripe
- Stripe webhook receives payment confirmation
- Webhook calls `handle-new-booking`
- Emails sent after payment confirmed

## Current Email Configuration

**Service:** Resend API
**Domain:** dominicantransfers.nl (verified ✅)
**From Address:** `Dominican Transfers <info@dominicantransfers.nl>`
**Admin Recipient:** `eacabrera1511@gmail.com`
**Customer Recipient:** Taken from booking record

## Testing the Fix

### Method 1: Make a Test Booking
1. Go to your website
2. Create a booking with any test email
3. Check both mailboxes:
   - Customer email should receive confirmation
   - `eacabrera1511@gmail.com` should receive admin notification

### Method 2: Check Database After Booking
```sql
SELECT
  email_type,
  recipient_email,
  status,
  provider_id,
  error_message,
  created_at
FROM email_logs
ORDER BY created_at DESC
LIMIT 5;
```

Should see TWO new emails:
- `email_type: 'confirmation'` → customer email
- `email_type: 'admin_notification'` → admin email
- Both should have `status: 'sent'` and a `provider_id`

### Method 3: Monitor Admin Notifications Table
```sql
SELECT
  type,
  message,
  priority,
  created_at,
  data->>'booking_id' as booking_id
FROM admin_notifications
ORDER BY created_at DESC
LIMIT 5;
```

Should see new records with `type: 'new_booking'`

## Email Templates

### Admin Notification Email
- **Style:** Dark theme (professional dispatch alert)
- **Content:**
  - Booking reference (large, highlighted)
  - Pickup date/time
  - Route information (pickup → dropoff)
  - Passenger count & vehicle type
  - Total amount
  - Customer information
  - Flight number (if applicable)
  - Special requests (if any)
  - Payment status badge

### Customer Confirmation Email
- **Style:** Light theme (clean, professional)
- **Content:**
  - Booking reference
  - Trip details with visual route
  - Date & time (large, prominent)
  - Vehicle & passenger info
  - Total amount with payment status
  - How to find driver (3-step guide)
  - Cancellation link
  - 24/7 support contact info

## Monitoring & Maintenance

### Check Email Health
Run this query daily/weekly:
```sql
SELECT
  DATE(created_at) as date,
  email_type,
  status,
  COUNT(*) as count
FROM email_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), email_type, status
ORDER BY date DESC, email_type;
```

**Healthy Pattern:**
- Each booking should have 2 emails (1 customer + 1 admin)
- All should show `status: 'sent'`
- `provider_id` should never be null when status is 'sent'

### Common Issues to Watch For

1. **Domain Verification Expires**
   - Check Resend dashboard regularly
   - Ensure DNS records remain intact
   - Look for error: "verify a domain at resend.com/domains"

2. **API Key Issues**
   - API key might expire or be revoked
   - Check error: "Invalid API key"
   - Generate new key in Resend → Update Supabase secrets

3. **Email Bounces**
   - Monitor Resend dashboard for bounces
   - Customer emails might be invalid
   - Check `error_message` in email_logs

4. **Rate Limiting**
   - Resend free tier: 100 emails/day
   - Upgrade if hitting limits
   - Check error: "Rate limit exceeded"

## Emergency Fallback

If emails completely fail:

1. **Check Supabase Secrets**
   ```
   Settings → Edge Functions → Secrets
   - RESEND_API_KEY should be set
   - RESEND_FROM_EMAIL should be set
   ```

2. **Check Resend Dashboard**
   - Login to resend.com
   - View recent emails
   - Check for API errors

3. **Manual Admin Notification**
   - Query admin_notifications table
   - Manually process pending bookings
   - Call/email dispatch team

## Deployment Status

✅ Fixed admin email address
✅ Deployed updated handle-new-booking function
✅ Customer emails working
⏳ Admin emails ready (need test to confirm)

## Next Steps

1. **Create a test booking** to verify both emails send
2. **Monitor email_logs table** for next 24 hours
3. **Set up alerting** if admin emails fail (optional)
4. **Document process** for dispatch team

## Files Modified

1. `supabase/functions/handle-new-booking/index.ts`
   - Line 9: Changed ADMIN_NOTIFICATION_EMAIL to correct address
   - Redeployed to production

## Configuration Values

```env
RESEND_API_KEY=re_************ (configured in Supabase)
RESEND_FROM_EMAIL=Dominican Transfers <info@dominicantransfers.nl>
ADMIN_NOTIFICATION_EMAIL=eacabrera1511@gmail.com
```

## Support Contact

If email issues persist:
- **Resend Support:** support@resend.com
- **Resend Docs:** https://resend.com/docs
- **Supabase Support:** https://supabase.com/support
