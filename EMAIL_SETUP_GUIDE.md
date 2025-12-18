# Email Setup Guide for Dominican Transfers

## Overview
The booking system is configured to send automated emails to customers and dispatch notifications to admin when bookings are made. The system uses **Resend** as the email service provider.

## Current Configuration
- **Default From Email**: `Dominican Transfers <info@dominicantransfers.nl>`
- **Admin Email**: `eacabrera1511@gmail.com`
- **Edge Functions Deployed**:
  - `send-booking-email` - Sends individual emails
  - `handle-new-booking` - Orchestrates customer & admin notifications

## Setup Instructions

### Step 1: Create a Resend Account
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### Step 2: Verify Your Domain
To send emails from `@dominicantransfers.nl`, you need to verify domain ownership:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter: `dominicantransfers.nl`
4. Resend will provide DNS records to add:
   - **TXT record** for domain verification
   - **MX records** for email receiving (optional)
   - **DKIM records** for email authentication
   - **SPF record** for sender verification

5. Add these DNS records to your domain registrar:
   - Log into your domain provider (GoDaddy, Namecheap, Cloudflare, etc.)
   - Navigate to DNS settings for `dominicantransfers.nl`
   - Add each record exactly as Resend specifies
   - Wait 24-48 hours for DNS propagation

6. Return to Resend and click **Verify Domain**

### Step 3: Get Your API Key
1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Name it: `Dominican Transfers Production`
4. Select permissions: **Sending access**
5. Click **Create**
6. **COPY THE KEY** - you won't see it again!

### Step 4: Configure Supabase Environment Variables
You need to add the Resend API key to your Supabase project:

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `gwlaxeonvfywhecwtupv`
3. Go to **Settings** → **Edge Functions**
4. Click **Add new secret**
5. Add these secrets:

   **Secret 1:**
   - Name: `RESEND_API_KEY`
   - Value: `re_xxxxx...` (paste your Resend API key)

   **Secret 2:**
   - Name: `RESEND_FROM_EMAIL`
   - Value: `Dominican Transfers <info@dominicantransfers.nl>`

6. Click **Save** for each secret

### Step 5: Verify Setup
After adding the secrets, test the email flow:

1. Go to your website: https://dominicantransfers.nl
2. Make a test booking
3. Check:
   - Customer receives confirmation email
   - Admin receives dispatch notification at `eacabrera1511@gmail.com`

### Step 6: Monitor Emails
You can monitor all email activity:

**In Supabase:**
- Run this query to see all emails:
```sql
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 20;
```

**In Resend Dashboard:**
- Go to **Emails** tab
- View delivery status, opens, clicks
- Check spam reports

## Email Types
The system sends these emails:

1. **Customer Confirmation** (`confirmation`)
   - Sent to customer after booking
   - Includes booking details, reference number
   - Cancellation link included

2. **Admin Notification** (`admin_notification`)
   - Sent to dispatch team
   - Includes full booking details
   - Requires immediate action

3. **Reminder** (`reminder`)
   - Sent day before pickup
   - Reminds customer of pickup time

4. **Completion** (`completion`)
   - Sent after trip completion
   - Thanks customer, requests feedback

5. **Cancellation** (`cancellation`)
   - Sent when booking is cancelled
   - Includes refund information if applicable

## Troubleshooting

### Emails Not Sending
1. **Check Supabase secrets are set**
   ```bash
   # View function logs in Supabase dashboard
   Settings → Edge Functions → Logs
   ```

2. **Check email_logs table**
   ```sql
   SELECT status, error_message, recipient_email
   FROM email_logs
   WHERE status != 'sent'
   ORDER BY created_at DESC;
   ```

3. **Verify domain in Resend**
   - Make sure domain status is "Verified" not "Pending"
   - Check all DNS records are properly configured

### Emails Going to Spam
1. **Check SPF/DKIM records** are properly configured
2. **Warm up your domain**: Start with low volume, increase gradually
3. **Add DMARC record** to your DNS:
   ```
   _dmarc.dominicantransfers.nl TXT "v=DMARC1; p=none; rua=mailto:info@dominicantransfers.nl"
   ```

### Domain Not Verifying
- DNS changes can take 24-48 hours
- Use [DNS Checker](https://dnschecker.org) to verify propagation
- Ensure records are added to root domain, not subdomain

## Testing Without Domain Verification
For initial testing, you can:
1. Use Resend's test email: `onboarding@resend.dev`
2. Update the default email in code temporarily
3. Emails will still be logged in `email_logs` table

## Email Template Customization
Email templates are in: `supabase/functions/send-booking-email/index.ts`

To customize:
1. Edit the HTML in `generateCustomerEmailHTML()` or `generateAdminDispatchEmailHTML()`
2. Deploy updated function (done automatically)

## Support
- **Resend Support**: support@resend.com
- **Documentation**: https://resend.com/docs

## Security Notes
- ✅ API keys are stored securely in Supabase secrets
- ✅ Not exposed to frontend/client
- ✅ Edge functions use service role key
- ✅ All emails logged for audit trail
- ✅ CORS properly configured for API endpoints
