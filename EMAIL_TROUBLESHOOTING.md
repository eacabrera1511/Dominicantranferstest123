# Email Troubleshooting Guide - Dominican Transfers

## Current Issue: Emails Not Sending

### What's Happening
Looking at your email logs, I can see:
- ✅ **ONE email succeeded** at 09:46:10 (to suus0309@live.nl)
- ❌ **All other emails failing** with domain verification error

### The Error Message
```
"You can only send testing emails to your own email address (eacabrera1511@gmail.com).
To send emails to other recipients, please verify a domain at resend.com/domains,
and change the `from` address to an email using this domain."
```

## What This Means

This error from Resend means one of these things:

### Option 1: Domain Not Verified (Most Likely)
Even though you added DNS records, Resend still shows the domain as "Pending" or "Not Verified"

**How to Check:**
1. Log into resend.com
2. Go to **Domains** section
3. Look at `dominicantransfers.nl` status
4. It should say **"Verified"** in green ✅

**If it says "Pending" or "Verifying":**
- DNS records haven't propagated yet (can take 24-48 hours)
- OR DNS records are incorrect

### Option 2: Wrong API Key Being Used
You might have multiple API keys in Resend, and you're using the wrong one.

**Check:**
1. In Resend dashboard → **API Keys**
2. Make sure you're using a key that has access to send from verified domains
3. Check if key says "Restricted" - it should be "Full Access" or "Sending Access"

### Option 3: API Key Created Before Domain Verification
If you created the API key BEFORE verifying the domain, it might not have permission.

**Solution:**
1. Go to Resend → **API Keys**
2. Delete the old API key
3. Click **Create API Key**
4. Name: `Dominican Transfers Production`
5. Select: **Sending access**
6. Copy the new key
7. Update in Supabase secrets

## Step-by-Step Fix

### 1️⃣ Verify Domain Status in Resend

Go to: https://resend.com/domains

You should see:
```
✅ dominicantransfers.nl - Verified
```

If it says "Pending", check your DNS records:

**Required DNS Records:**
```
Type: TXT
Name: @ (or dominicantransfers.nl)
Value: [Provided by Resend]

Type: TXT
Name: resend._domainkey
Value: [DKIM key provided by Resend]

Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all
```

**How to Check DNS Propagation:**
1. Go to: https://dnschecker.org
2. Select "TXT" as record type
3. Enter: `dominicantransfers.nl`
4. Click "Search"
5. Should show TXT records globally

### 2️⃣ Create New API Key (AFTER Domain is Verified)

**IMPORTANT:** Only do this AFTER domain shows "Verified" in Resend!

1. Log into Resend: https://resend.com/api-keys
2. Click **Create API Key**
3. Settings:
   - Name: `Dominican Transfers Production`
   - Permission: **Sending access**
   - Domain: `dominicantransfers.nl` (should be in dropdown)
4. Click **Create**
5. **COPY THE KEY** immediately (starts with `re_`)

### 3️⃣ Update Supabase Secrets

1. Go to Supabase Dashboard
2. Navigate to: **Settings** → **Edge Functions** → **Secrets**
3. Find `RESEND_API_KEY`
4. Click **Edit**
5. Paste the NEW API key
6. Click **Save**

### 4️⃣ Test the Email System

After updating, test immediately:

**Option A: Use Test Function**
Call this URL in your browser:
```
https://gwlaxeonvfywhecwtupv.supabase.co/functions/v1/test-resend-config
```

Should return:
```json
{
  "status": "ready",
  "message": "Resend is properly configured and test email sent successfully!",
  ...
}
```

**Option B: Make a Real Booking**
1. Go to your website
2. Make a test booking with YOUR email (eacabrera1511@gmail.com)
3. Check if email arrives

### 5️⃣ Check Email Logs

After testing, check the database:
```sql
SELECT
  email_type,
  recipient_email,
  status,
  error_message,
  sent_at
FROM email_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

Should see:
- `status: 'sent'`
- `error_message: null`
- `sent_at: [timestamp]`

## Common Problems & Solutions

### Problem: "Domain not found"
**Solution:** Make sure you added `dominicantransfers.nl` in Resend (without www)

### Problem: "SPF check failed"
**Solution:** Add SPF record to DNS:
```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all
```

### Problem: "DKIM verification failed"
**Solution:** Add DKIM records EXACTLY as shown in Resend dashboard. Common mistakes:
- Using wrong subdomain (should be `resend._domainkey`)
- Copy/paste errors in the long DKIM value
- Adding quotes around the value (don't!)

### Problem: Emails going to spam
**After** domain is verified, add DMARC record:
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:info@dominicantransfers.nl
```

## Alternative Solution: Use Verified Domain Temporarily

If you need emails working NOW while DNS propagates:

1. In Resend, add your account email domain
2. For example, if your account is `eacabrera1511@gmail.com`, verify `gmail.com` (not possible)
3. OR use Resend's onboarding domain temporarily

**Update the from address:**
```typescript
// Temporarily change from:
'Dominican Transfers <info@dominicantransfers.nl>'

// To:
'Dominican Transfers <onboarding@resend.dev>'
```

This will work immediately but emails might go to spam. Switch back once domain is verified.

## How to Update From Address Temporarily

If you want to test with onboarding@resend.dev:

1. Go to Supabase → Settings → Edge Functions → Secrets
2. Find `RESEND_FROM_EMAIL`
3. Change to: `Dominican Transfers <onboarding@resend.dev>`
4. Test booking - should work immediately
5. Change back once domain verified

## Verification Checklist

Use this checklist to verify everything:

- [ ] Logged into resend.com
- [ ] Domain `dominicantransfers.nl` added in Resend
- [ ] Domain status shows "Verified" (green checkmark)
- [ ] DNS TXT record added for domain verification
- [ ] DNS TXT record added for DKIM
- [ ] DNS TXT record added for SPF
- [ ] DNS records verified at dnschecker.org
- [ ] API key created AFTER domain verification
- [ ] API key updated in Supabase secrets
- [ ] Test function returns "ready" status
- [ ] Test email received successfully
- [ ] Email logs show status: 'sent'

## Still Not Working?

If you've done all of the above and it's still not working:

1. **Take a screenshot** of:
   - Resend domains page (showing verification status)
   - DNS records in your domain registrar
   - Supabase secrets page (hide the actual key values)

2. **Check the actual API response:**
   - View Supabase edge function logs
   - Look for the actual error from Resend API

3. **Verify the from address matches exactly:**
   - Current setting: `info@dominicantransfers.nl`
   - Domain in Resend: `dominicantransfers.nl`
   - These MUST match!

## Quick Test Command

Run this SQL to see your latest email attempts:
```sql
SELECT
  created_at,
  email_type,
  recipient_email,
  status,
  provider_id,
  error_message
FROM email_logs
ORDER BY created_at DESC
LIMIT 5;
```

If `provider_id` is NULL and `error_message` is set → API call failed
If `provider_id` exists → Email was accepted by Resend
