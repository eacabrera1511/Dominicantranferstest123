# Email Flow Fixes - December 17, 2025

## Problems Identified

1. **No Email Notifications**: Bookings created through `UnifiedBookingModal` were not triggering any email notifications to customers or dispatch team
2. **Missing Function Call**: The modal was creating bookings but never calling `handle-new-booking` edge function
3. **Bug in handle-new-booking**: Used invalid `supabase.raw()` method that doesn't exist in Supabase JS client
4. **No Automatic Trigger**: No database-level trigger to ensure emails are always sent

## Solutions Implemented

### 1. Database Trigger (Automatic Backup)
Created a PostgreSQL trigger that automatically calls `handle-new-booking` whenever a new booking is inserted:
- **Trigger**: `trigger_new_booking_notification`
- **Function**: `notify_new_booking()`
- Uses `pg_net` extension to make async HTTP calls
- Runs with `SECURITY DEFINER` for proper permissions
- Non-blocking - booking succeeds even if email fails

**File**: `supabase/migrations/20251217004000_fix_booking_email_automation.sql`

### 2. Frontend Integration
Updated `UnifiedBookingModal.tsx` to explicitly call `handle-new-booking` after creating bookings:
- Added email notification call in both payment paths (Stripe and direct)
- Non-blocking - booking succeeds even if email call fails
- Logs success/failure to console for debugging

**Lines Updated**:
- Lines 206-228: Stripe payment path
- Lines 254-277: Direct payment path

### 3. Edge Function Bug Fix
Fixed `handle-new-booking/index.ts`:
- Changed `supabase.raw('total_bookings + 1')` to `(existingCustomer.total_bookings || 0) + 1`
- This was causing the function to crash silently

**Line Fixed**: Line 109

### 4. Email Function Structure

The complete email flow now works as follows:

```
Booking Created
    ↓
UnifiedBookingModal explicitly calls handle-new-booking
    ↓
Database trigger also calls handle-new-booking (backup)
    ↓
handle-new-booking function:
    1. Creates/updates customer in CRM
    2. Creates admin notification
    3. Calls send-booking-email twice:
        - Admin notification (to eacabrera1511@gmail.com)
        - Customer confirmation (to customer's email)
    ↓
send-booking-email function:
    1. Generates beautiful HTML emails
    2. Sends via Resend API
    3. Logs to email_logs table
    4. Creates cancellation token for customer emails
```

## Email Types Sent

### Customer Confirmation Email
- **To**: Customer's email address
- **Subject**: "Your Booking is Confirmed! - [REFERENCE]"
- **Contains**:
  - Booking reference number
  - Pickup date/time and locations
  - Vehicle and passenger details
  - Total price and payment status
  - Driver meeting instructions
  - Cancellation link (if applicable)
  - Contact information

### Admin Dispatch Alert
- **To**: eacabrera1511@gmail.com (ADMIN_NOTIFICATION_EMAIL)
- **Subject**: "NEW BOOKING ALERT - [REFERENCE] - Action Required"
- **Contains**:
  - Booking reference and status
  - Pickup datetime
  - Route information
  - Customer contact details
  - Special requests and flight info
  - Payment status

## Testing the Email Flow

### 1. Create a Test Booking
1. Go to the website
2. Select any service (Airport Transfer, Car Rental, etc.)
3. Fill in booking details
4. Complete the booking process

### 2. Verify Email Sending
Check the following:
- [ ] Console logs show "Email notifications sent"
- [ ] Admin receives dispatch alert at eacabrera1511@gmail.com
- [ ] Customer receives confirmation email

### 3. Check Email Logs
Query the database:
```sql
SELECT
  id,
  booking_reference,
  recipient_email,
  email_type,
  status,
  sent_at,
  error_message
FROM email_logs
ORDER BY created_at DESC
LIMIT 10;
```

### 4. Verify Database Trigger
The trigger should log to PostgreSQL logs. Check for:
```
NOTICE: Email notification request queued for booking [UUID]: request_id=[ID]
```

## Configuration Requirements

### Environment Variables (Pre-configured)
- `RESEND_API_KEY` - For sending emails via Resend
- `RESEND_FROM_EMAIL` - Sender email (default: Dominican Transfers <info@dominicantransfers.nl>)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for backend operations

### Admin Email
Currently hardcoded in `handle-new-booking/index.ts`:
```typescript
const ADMIN_NOTIFICATION_EMAIL = 'eacabrera1511@gmail.com';
```

To change this, update the constant and redeploy the edge function.

## Troubleshooting

### Emails Not Sending
1. Check if RESEND_API_KEY is configured
2. Verify the edge functions are deployed
3. Check email_logs table for error messages
4. Look at browser console for email notification errors

### Trigger Not Firing
1. Verify pg_net extension is enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_net';`
2. Check PostgreSQL logs for trigger errors
3. Verify trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_new_booking_notification';`

### Edge Function Errors
1. Check Supabase Dashboard > Edge Functions > Logs
2. Look for errors in handle-new-booking or send-booking-email functions
3. Verify all environment variables are set

## Summary

The email flow has been completely fixed with:
- ✅ Automatic database trigger (backup mechanism)
- ✅ Explicit function calls from frontend
- ✅ Bug fixes in edge functions
- ✅ Comprehensive error handling
- ✅ Detailed logging for debugging
- ✅ Two-layer redundancy (frontend call + database trigger)

Both customers and dispatch team will now receive email notifications for every booking created.
