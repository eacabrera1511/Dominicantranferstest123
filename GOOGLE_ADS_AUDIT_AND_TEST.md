# Google Ads Conversion Tracking - Complete Audit & Testing Guide

## Executive Summary

This document provides a comprehensive audit of the Google Ads conversion tracking implementation and step-by-step testing procedures to verify proper functionality.

**Status:** ✅ Conversion tracking is FULLY IMPLEMENTED across all payment flows

---

## 🎯 Current Implementation Overview

### Account Configuration
- **Google Ads Account ID:** `AW-17810479345`
- **Click Conversion Label:** `AW-17810479345/vMD-CIrB8dMbEPGx2axC`
- **Purchase Conversion Label:** `AW-17810479345` (base account)

### Two Conversion Types

#### 1. Click Conversions (Engagement Tracking)
- **Value:** €1.00 EUR per event
- **Triggers:**
  - Phone button clicks
  - Email button clicks
  - Booking modal opens from chat
- **Purpose:** Track early-stage user intent
- **Implementation:** `index.html` lines 30-49

#### 2. Purchase Conversions (Revenue Tracking)
- **Value:** Actual booking amount in USD
- **Triggers:** Payment completion (both Stripe and direct)
- **Purpose:** Track actual revenue and ROI
- **Implementation:** Multiple locations (detailed below)

---

## 🔍 Complete Payment Flow Analysis

### Flow 1: Direct Payment (iDEAL, etc.)
```
1. User fills booking details → UnifiedBookingModal.tsx
2. User enters customer info → CustomerInfoStep.tsx
3. User selects payment method → PaymentStep.tsx
4. Payment completes → handlePaymentComplete()
5. Booking saved to database
6. Step advances to SuccessStep (step 4)
7. SuccessStep.tsx useEffect triggers
8. ✅ CONVERSION FIRES → SuccessStep.tsx lines 22-42
```

**Conversion Trigger Location:**
- **File:** `src/components/bookings/SuccessStep.tsx`
- **Lines:** 22-42
- **Trigger:** `useEffect` on component mount when `completedBooking` exists
- **Data Passed:**
  - `value`: totalPrice (USD)
  - `transaction_id`: bookingReference
  - `currency`: 'USD'
  - `send_to`: 'AW-17810479345'

### Flow 2: Stripe Payment (Card)
```
1. User fills booking details → UnifiedBookingModal.tsx
2. User enters customer info → CustomerInfoStep.tsx
3. User selects Card payment → PaymentStep.tsx
4. Booking created in database
5. User redirected to Stripe checkout
6. User completes payment on Stripe
7. Stripe redirects back with: ?booking_success=true&booking_id=XXX
8. App.tsx detects query params → line 203
9. handleBookingReference() called → line 173
10. setShowPaymentSuccess(true) triggered → line 183
11. useEffect triggers on showPaymentSuccess → line 91
12. ✅ CONVERSION FIRES → App.tsx lines 106-111
```

**Conversion Trigger Location:**
- **File:** `src/App.tsx`
- **Lines:** 91-124 (useEffect hook)
- **Trigger:** When `showPaymentSuccess` and `paymentBookingRef` are set
- **Data Fetched:** Booking data from database (total_price, id)
- **Data Passed:**
  - `value`: data.total_price (USD)
  - `transaction_id`: paymentBookingRef
  - `currency`: 'USD'
  - `send_to`: 'AW-17810479345'

---

## 📋 Implementation Checklist

### Google Tag Installation
- [x] Global gtag script in `<head>` (index.html:16-27)
- [x] Account ID configured: AW-17810479345
- [x] DataLayer initialized
- [x] Async loading for performance
- [x] Debug logging enabled

### Click Conversion Setup
- [x] Function defined: `gtag_report_conversion()` (index.html:30-49)
- [x] Phone button integration (App.tsx)
- [x] Email button integration (App.tsx)
- [x] Booking modal trigger (App.tsx)
- [x] Correct label: vMD-CIrB8dMbEPGx2axC
- [x] Value: €1.00 EUR

### Purchase Conversion Setup
- [x] Direct payment flow (SuccessStep.tsx:22-42)
- [x] Stripe payment flow (App.tsx:91-124)
- [x] Correct account ID: AW-17810479345
- [x] Dynamic value passing (actual booking amount)
- [x] Unique transaction IDs
- [x] USD currency specification

### Verification Tools
- [x] Verification functions (gtagVerification.ts)
- [x] Test page (public/test-gtag.html)
- [x] Console logging for debugging
- [x] Global verification commands

---

## 🧪 Testing Procedures

### Pre-Test Checklist
1. Site must be on production URL (not localhost)
2. Disable all ad blockers
3. Open browser console (F12)
4. Clear browser cache
5. Use incognito/private mode (optional but recommended)

### Test 1: Verify Tag Installation

**Steps:**
1. Open production site: `https://www.dominicantransfers.nl`
2. Open Developer Tools (F12) → Console tab
3. Run: `window.verifyGoogleAds()`
4. Expected output:
```
🎯 Google Ads Tracking Status
Loaded: ✅
DataLayer: ✅
gtag Function: ✅
Account ID: AW-17810479345
```

**If any ❌ appears:**
- Check if ad blocker is disabled
- Check Network tab for gtag.js (should be 200 OK)
- Check for console errors
- See troubleshooting section

### Test 2: Test Click Conversion

**Steps:**
1. On homepage, click the green phone button
2. Check console for:
```
🎯 Click conversion tracked: button click
```
3. Verify in Google Ads dashboard after 3-6 hours

**Alternative test:**
1. Visit: `https://www.dominicantransfers.nl/test-gtag.html`
2. Click "👆 Test Click Conversion"
3. Check console for confirmation
4. Verify in Google Ads dashboard

### Test 3: Test Direct Payment Conversion (iDEAL)

**Steps:**
1. Start a new booking from chat or service cards
2. Fill in all details:
   - Pickup location: "PUJ Airport"
   - Dropoff location: "Bavaro Beach"
   - Date & time
   - Passengers
3. Enter customer information
4. Select "iDEAL" payment method
5. Select any bank
6. Click "Pay secure"
7. Wait for Success screen
8. **Check console immediately:**
```
🎯 Firing Google Ads conversion from SuccessStep: {
  value: 150,
  transaction_id: "BK-ABC12345"
}
✅ Conversion event sent successfully
```
9. Verify in Google Ads dashboard after 3-6 hours

**Expected behavior:**
- Success screen appears
- Booking reference shown (e.g., BK-ABC12345)
- Console shows conversion fired
- No errors in console

### Test 4: Test Stripe Payment Conversion (Card)

**Steps:**
1. Start a new booking with a route that triggers Stripe:
   - Pickup: "PUJ Airport"
   - Dropoff: "Hotel in Bavaro"
   - Must be airport transfer or car rental
2. Fill all booking details
3. Enter customer information
4. Select "Credit/Debit Card" payment
5. Enter test card details (if test mode):
   - Card: 4242 4242 4242 4242
   - Expiry: Any future date
   - CVV: Any 3 digits
6. Click "Pay secure"
7. **You will be redirected to Stripe**
8. Complete payment on Stripe
9. **After redirect back to site, check console:**
```
🎯 Firing Google Ads conversion: {
  value: 150,
  transaction_id: "BK-ABC12345"
}
✅ Conversion event sent successfully
```
10. Success modal should appear
11. Verify in Google Ads dashboard after 3-6 hours

**Expected behavior:**
- Redirect to Stripe checkout
- Return to site after payment
- Success modal appears automatically
- Console shows conversion fired
- URL briefly shows: `?booking_success=true&booking_id=XXX`

### Test 5: Network Verification

**Steps:**
1. Open Developer Tools → Network tab
2. Filter by "google"
3. Complete a test booking
4. Look for these requests:
   - `googletagmanager.com/gtag/js` → Status: 200
   - `google-analytics.com/g/collect` → Status: 200
   - `googleadservices.com/pagead/conversion` → Status: 200

**Expected behavior:**
- All Google requests return 200 OK
- Conversion request sent with booking data
- No 403, 404, or 500 errors

### Test 6: Multi-Conversion Verification

**Purpose:** Verify both click AND purchase conversions in same session

**Steps:**
1. Clear browser cache
2. Visit homepage
3. Click phone button → Check for click conversion log
4. Complete a booking → Check for purchase conversion log
5. Console should show:
```
🎯 Click conversion tracked: button click
... (booking process) ...
🎯 Firing Google Ads conversion: {value: 150, transaction_id: "BK-ABC123"}
✅ Conversion event sent successfully
```
6. Verify BOTH conversions appear in Google Ads

---

## ⚠️ Known Issues & Solutions

### Issue 1: "gtag is not defined"

**Symptoms:**
- Console error: `window.gtag is not a function`
- Conversion doesn't fire

**Causes:**
1. Ad blocker is blocking gtag.js
2. Script hasn't loaded yet
3. CSP policy blocking Google scripts

**Solutions:**
1. Disable all ad blockers
2. Check if gtag.js loads in Network tab
3. Add delay before calling gtag (already implemented)
4. Check CSP headers on server

**Verification:**
```javascript
console.log(typeof window.gtag); // Should be "function"
console.log(window.dataLayer); // Should be array
```

### Issue 2: Conversion Fires But Doesn't Appear in Google Ads

**Symptoms:**
- Console shows "✅ Conversion event sent successfully"
- No conversion in Google Ads dashboard

**Causes:**
1. Testing on localhost (Google can't track localhost)
2. Ad blocker blocking final request
3. Conversion attribution window
4. Google Ads dashboard delay (3-6 hours)
5. Wrong account ID
6. Conversion action not set up in Google Ads

**Solutions:**
1. Test only on production URL
2. Disable ad blockers completely
3. Wait 24-72 hours for attribution
4. Verify account ID: AW-17810479345
5. Check Google Ads → Conversions to ensure action exists
6. Use Google Tag Assistant Chrome extension

### Issue 3: Stripe Payment Doesn't Trigger Conversion

**Symptoms:**
- Success modal appears
- No conversion log in console

**Debugging Steps:**
1. Check URL after Stripe redirect: Should have `?booking_success=true&booking_id=XXX`
2. Check if `handleBookingReference` is called:
   ```javascript
   // Add breakpoint or log in App.tsx line 173
   ```
3. Check if `showPaymentSuccess` state is set:
   ```javascript
   // Add log in App.tsx line 183
   ```
4. Verify useEffect triggers:
   ```javascript
   // Check logs in App.tsx lines 91-124
   ```

**Common causes:**
1. Query parameters stripped by router
2. useEffect dependencies incorrect
3. gtag not loaded when effect runs
4. Booking data not found in database

**Solutions:**
1. Verify query params present after redirect
2. Check useEffect dependencies array
3. Add gtag availability check
4. Verify booking was saved to database

### Issue 4: Multiple Conversions Firing

**Symptoms:**
- Same transaction_id appears multiple times
- Inflated conversion counts

**Causes:**
1. Component re-rendering multiple times
2. useEffect running multiple times
3. User refreshing success page

**Prevention:**
- ✅ Already implemented: useEffect with proper dependencies
- ✅ Already implemented: Transaction ID prevents duplicates
- ✅ Already implemented: URL parameters cleaned after use

### Issue 5: Wrong Conversion Value

**Symptoms:**
- Conversion fires with $0
- Conversion fires with wrong amount

**Debugging:**
1. Check booking data in database
2. Verify `total_price` field exists
3. Check currency conversion if applicable

**Verification query:**
```javascript
// In console after booking
const bookingRef = 'BK-ABC123'; // Your booking reference
const { data } = await supabase
  .from('bookings')
  .select('total_price, reference')
  .eq('reference', bookingRef)
  .single();
console.log('Booking data:', data);
```

---

## 🔧 Diagnostic Tools

### Built-in Console Commands

```javascript
// Verify tag installation
window.verifyGoogleAds()

// Test purchase conversion with custom values
window.testGoogleAdsConversion(100, 'TEST-123')

// Test click conversion
window.gtag_report_conversion()

// Check dataLayer contents
console.log(window.dataLayer)

// Check if gtag is loaded
console.log(typeof window.gtag)
```

### Manual Conversion Test

```javascript
// Send a test purchase conversion
window.gtag('event', 'conversion', {
  'send_to': 'AW-17810479345',
  'value': 99.99,
  'currency': 'USD',
  'transaction_id': 'TEST-' + Date.now()
});

// Send a test click conversion
window.gtag('event', 'conversion', {
  'send_to': 'AW-17810479345/vMD-CIrB8dMbEPGx2axC',
  'value': 1.0,
  'currency': 'EUR'
});
```

### Monitor All gtag Events

```javascript
// Intercept all gtag calls
const originalGtag = window.gtag;
window.gtag = function() {
  console.log('📊 gtag called with:', Array.from(arguments));
  originalGtag.apply(window, arguments);
};
```

### Check Booking Data

```javascript
// Verify booking was saved correctly
const checkBooking = async (bookingRef) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('reference', bookingRef)
    .single();

  console.log('Booking data:', data);
  console.log('Error:', error);

  if (data) {
    console.log('Total price:', data.total_price);
    console.log('Payment status:', data.payment_status);
    console.log('Status:', data.status);
  }
};

// Usage:
checkBooking('BK-ABC12345');
```

---

## 📊 Google Ads Dashboard Verification

### Where to Check Conversions

1. **Login to Google Ads:**
   - Visit: https://ads.google.com
   - Select your account

2. **Navigate to Conversions:**
   - Click: Tools & Settings (wrench icon)
   - Under "Measurement", click: Conversions

3. **View Conversion Actions:**
   - You should see 2 conversion actions:
     - **Page view** (Label: vMD-CIrB8dMbEPGx2axC) - Click conversions
     - **Purchase/Booking** (Account level) - Revenue conversions

4. **Check Recent Conversions:**
   - Click on each conversion action
   - View last 7 days
   - Look for test conversions

5. **Campaign Performance:**
   - Go to Campaigns
   - Add columns: Conversions, Conv. value, Cost per conv.
   - Segment by: Conversion action

### Expected Data in Dashboard

**For Click Conversions:**
- Conversion name: "Page view" or similar
- Value: €1.00 per conversion
- Count: Every click

**For Purchase Conversions:**
- Conversion name: "Purchase" or "Booking"
- Value: Varies (actual booking amounts)
- Count: One per booking

### Conversion Attribution

- **Window:** Last 30 days (default)
- **Model:** Last click (default)
- **Counting:** Click conversions = Every, Purchase = One

---

## 🎯 Success Criteria

Your conversion tracking is working correctly if:

### Technical Verification
- ✅ `window.gtag` is defined (function)
- ✅ `window.dataLayer` exists (array)
- ✅ gtag.js loads without errors (200 OK)
- ✅ Console shows conversion logs
- ✅ No JavaScript errors in console
- ✅ Network requests to Google servers succeed

### Functional Verification
- ✅ Click conversions fire on phone/email clicks
- ✅ Click conversions fire on booking initiation
- ✅ Purchase conversions fire on payment success (iDEAL)
- ✅ Purchase conversions fire on Stripe return
- ✅ Correct transaction IDs logged
- ✅ Correct values sent (in USD)
- ✅ Success modal appears after payment

### Google Ads Verification
- ✅ Conversions appear in dashboard (3-6 hours)
- ✅ Both conversion types show data
- ✅ Values match actual bookings
- ✅ No duplicate conversions with same transaction_id
- ✅ Conversion counts align with bookings

---

## 🚨 Red Flags to Watch For

### Critical Issues
- ❌ gtag function not defined
- ❌ No conversion logs in console
- ❌ Network errors (403, 404, 500)
- ❌ Conversion fires with $0 value
- ❌ Same transaction_id fires multiple times
- ❌ No conversions in Google Ads after 72 hours

### Warning Signs
- ⚠️ Console errors related to Google scripts
- ⚠️ Ad blocker warnings
- ⚠️ CSP policy warnings
- ⚠️ Conversion fires on localhost
- ⚠️ Missing transaction_id
- ⚠️ Currency mismatch (EUR vs USD)

---

## 📝 Testing Checklist

Print this and check off during testing:

### Initial Setup
- [ ] Production URL accessed (not localhost)
- [ ] Ad blockers disabled in browser
- [ ] Browser console open (F12)
- [ ] Network tab open and recording
- [ ] Incognito/private mode (optional)

### Tag Verification
- [ ] Run `window.verifyGoogleAds()` - all ✅
- [ ] Check Network tab - gtag.js loads (200 OK)
- [ ] Check console - no errors
- [ ] Visit test page - all diagnostics pass

### Click Conversion Testing
- [ ] Click phone button - conversion logs
- [ ] Click email button - conversion logs
- [ ] Open booking modal from chat - conversion logs
- [ ] Test page click conversion button works
- [ ] Console shows: "🎯 Click conversion tracked"

### Direct Payment Testing (iDEAL)
- [ ] Complete booking with iDEAL payment
- [ ] Success screen appears
- [ ] Console shows: "🎯 Firing Google Ads conversion"
- [ ] Console shows: "✅ Conversion event sent successfully"
- [ ] Booking reference displayed
- [ ] No errors in console
- [ ] Network tab shows conversion request (200 OK)

### Stripe Payment Testing (Card)
- [ ] Complete booking with card payment
- [ ] Redirect to Stripe happens
- [ ] Complete payment on Stripe
- [ ] Redirect back to site happens
- [ ] URL shows: ?booking_success=true&booking_id=XXX
- [ ] Success modal appears automatically
- [ ] Console shows: "🎯 Firing Google Ads conversion"
- [ ] Console shows: "✅ Conversion event sent successfully"
- [ ] No errors in console
- [ ] Network tab shows conversion request (200 OK)

### Google Ads Verification
- [ ] Wait 3-6 hours after test
- [ ] Login to Google Ads dashboard
- [ ] Navigate to Conversions section
- [ ] Both conversion types visible
- [ ] Test conversions appear in data
- [ ] Values are correct
- [ ] No duplicates with same transaction_id

### Documentation
- [ ] Screenshot successful conversion logs
- [ ] Screenshot Google Ads dashboard
- [ ] Note any errors or warnings
- [ ] Document test booking references
- [ ] Record timestamp of tests

---

## 💡 Best Practices for Ongoing Monitoring

### Daily Checks
1. Review Google Ads dashboard for anomalies
2. Check conversion rates are stable
3. Verify no sudden drops or spikes
4. Monitor cost per conversion

### Weekly Reviews
1. Analyze conversion funnel:
   - Click conversions → Purchase conversions
   - Calculate conversion rate
   - Identify drop-off points
2. Compare with booking records in database
3. Check for any duplicate conversions
4. Review transaction IDs for patterns

### Monthly Audits
1. Full end-to-end testing
2. Verify all payment flows
3. Check gtag.js version updates
4. Review Google Ads policies compliance
5. Validate conversion values match revenue
6. Test on different devices/browsers

### Maintenance Tasks
1. Keep gtag.js loading from CDN (auto-updates)
2. Monitor browser console in production
3. Set up alerts for conversion drops
4. Document any changes to tracking code
5. Backup current implementation before updates

---

## 🎓 Understanding the Data Flow

### Data Flow Diagram

```
USER ACTION → FRONTEND CODE → GOOGLE TAG → GOOGLE SERVERS → GOOGLE ADS

Click Action:
Phone Click → App.tsx → gtag_report_conversion() → gtag.js → Google Analytics → Google Ads
                       (index.html function)          (CDN)     (g/collect)    (Dashboard)

Purchase Action (Direct):
Payment Success → SuccessStep.tsx → window.gtag() → gtag.js → Google Analytics → Google Ads
                  (useEffect)        (conversion event)  (CDN)     (g/collect)    (Dashboard)

Purchase Action (Stripe):
Stripe Return → App.tsx → fetchBooking → window.gtag() → gtag.js → Google Analytics → Google Ads
                (useEffect) (from DB)    (conversion event)  (CDN)     (g/collect)    (Dashboard)
```

### Key Data Points

**Transaction ID:**
- Format: `BK-XXXXXX` (6-digit timestamp + 4-char random)
- Generated: `UnifiedBookingModal.tsx` line 62-65
- Stored: `bookings.reference` column
- Prevents duplicate conversion counting

**Conversion Value:**
- Source: `bookings.total_price` column
- Currency: Always USD
- Precision: 2 decimal places
- Sent as-is to Google Ads

**Timing:**
- Click conversions: Immediate (0-1 second)
- Purchase conversions:
  - Direct: Immediate on success screen
  - Stripe: On return from Stripe (3-10 seconds)
- Google Ads processing: 3-6 hours
- Dashboard visibility: 24-72 hours (initial setup)

---

## 🔐 Security & Privacy Notes

### GDPR Compliance
- ✅ No personal data sent to Google Ads
- ✅ Transaction IDs are anonymous
- ✅ Customer emails/names not included
- ✅ Only aggregate conversion data tracked

### Data Sent to Google
**Click Conversions:**
- Event type: 'conversion'
- Label: vMD-CIrB8dMbEPGx2axC
- Value: 1.0 EUR
- Timestamp: Automatic

**Purchase Conversions:**
- Event type: 'conversion'
- Account: AW-17810479345
- Value: Booking amount (USD)
- Transaction ID: Booking reference
- Currency: USD
- Timestamp: Automatic

**NOT Sent:**
- Customer name
- Customer email
- Customer phone
- Customer address
- Payment details
- Credit card info
- Passport/ID info

### Security Measures
- ✅ Async script loading (no blocking)
- ✅ CDN delivery (fast, cached)
- ✅ HTTPS only
- ✅ No sensitive data exposure
- ✅ Transaction ID prevents fraud
- ✅ Client-side only (no server secrets)

---

## 📞 Support & Resources

### Internal Resources
- **Verification Tool:** `window.verifyGoogleAds()`
- **Test Page:** `/test-gtag.html`
- **Docs:** `GOOGLE_ADS_TROUBLESHOOTING.md`
- **Setup Guide:** `GOOGLE_ADS_FINAL_SETUP.md`

### Google Resources
- **Google Ads Help:** https://support.google.com/google-ads
- **gtag.js Reference:** https://developers.google.com/gtagjs
- **Conversion Tracking:** https://support.google.com/google-ads/answer/1722022
- **Tag Assistant:** https://tagassistant.google.com

### Chrome Extensions
- **Google Tag Assistant Legacy:** For tag verification
- **Google Analytics Debugger:** For detailed event logs
- **Facebook Pixel Helper:** (If using Facebook ads too)

---

## ✅ Final Verification

Run through this final checklist before considering the audit complete:

1. **Installation Verified:**
   - [ ] gtag script in `<head>` tag
   - [ ] Account ID correct: AW-17810479345
   - [ ] Both conversion types configured

2. **Code Review Complete:**
   - [ ] SuccessStep.tsx conversion code reviewed
   - [ ] App.tsx Stripe return code reviewed
   - [ ] Click conversion function reviewed
   - [ ] All console logs present for debugging

3. **Testing Complete:**
   - [ ] Tag installation test passed
   - [ ] Click conversion test passed
   - [ ] Direct payment test passed
   - [ ] Stripe payment test passed
   - [ ] Network requests verified

4. **Google Ads Verified:**
   - [ ] Both conversion actions visible
   - [ ] Test conversions appeared
   - [ ] Values correct
   - [ ] No errors in dashboard

5. **Documentation Complete:**
   - [ ] Screenshots saved
   - [ ] Test results documented
   - [ ] Any issues noted
   - [ ] Action items identified

---

## 🎉 Conclusion

Your Google Ads conversion tracking is **PRODUCTION READY** if all tests pass.

**Current Status:**
- ✅ Tag installed correctly
- ✅ Click conversions configured
- ✅ Purchase conversions configured
- ✅ Both payment flows covered
- ✅ Debugging tools available
- ✅ Console logging enabled
- ✅ GDPR compliant
- ✅ Security best practices followed

**Next Steps:**
1. Deploy to production if not already done
2. Complete all tests in this document
3. Wait 24-72 hours for Google Ads data
4. Begin campaign optimization
5. Monitor daily for anomalies

**Support:**
If you encounter issues not covered in this document, refer to:
- `GOOGLE_ADS_TROUBLESHOOTING.md` - Detailed troubleshooting
- `GOOGLE_ADS_FINAL_SETUP.md` - Setup instructions
- Test page: `/test-gtag.html` - Live testing tool

Your conversion tracking is now ready to accurately measure ROI and optimize your Google Ads campaigns!
