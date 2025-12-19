# Google Ads Conversion Testing - Quick Checklist

**Use this checklist to quickly verify your conversion tracking is working**

---

## ✅ Pre-Testing Setup

- [ ] Deployed to production URL (not localhost)
- [ ] Ad blockers disabled in browser
- [ ] Browser DevTools open (F12)
- [ ] Console tab visible

---

## 🔍 Test 1: Installation Verification (2 min)

**Action:**
1. Open: `https://www.dominicantransfers.nl`
2. Console → Type: `window.verifyGoogleAds()`
3. Press Enter

**Expected Output:**
```
🎯 Google Ads Tracking Status
Loaded: ✅
DataLayer: ✅
gtag Function: ✅
Account ID: AW-17810479345
```

**Result:** [ ] PASS / [ ] FAIL

**If FAIL:** Check ad blocker is disabled, refresh page

---

## 👆 Test 2: Click Conversion (1 min)

**Action:**
1. Click the green phone button
2. Check console immediately

**Expected Output:**
```
🎯 Click conversion tracked: button click
```

**Result:** [ ] PASS / [ ] FAIL

**If FAIL:** Run `typeof window.gtag_report_conversion` should return "function"

---

## 💳 Test 3A: Direct Payment Conversion (5 min)

**Action:**
1. Start booking from chat or service card
2. Fill booking details (PUJ Airport → Bavaro)
3. Enter customer info
4. Select iDEAL payment
5. Select any bank
6. Click "Pay secure"
7. Wait for success screen
8. **Check console immediately**

**Expected Output:**
```
🎯 Firing Google Ads conversion from SuccessStep: {
  value: 150,
  transaction_id: "BK-XXXXXX"
}
✅ Conversion event sent successfully
```

**Actual Transaction ID:** ___________________

**Result:** [ ] PASS / [ ] FAIL

**If FAIL:** Check `completedBooking` prop is set in SuccessStep component

---

## 💳 Test 3B: Stripe Payment Conversion (10 min)

**Action:**
1. Start booking (must trigger Stripe: Airport → Hotel)
2. Fill booking details
3. Enter customer info
4. Select "Credit/Debit Card"
5. Enter card details (4242 4242 4242 4242)
6. Click "Pay secure"
7. Complete payment on Stripe
8. **After redirect back, check console**

**Expected Output:**
```
🎯 Firing Google Ads conversion: {
  value: 150,
  transaction_id: "BK-XXXXXX"
}
✅ Conversion event sent successfully
```

**Check URL briefly shows:** `?booking_success=true&booking_id=XXXX`

**Actual Transaction ID:** ___________________

**Result:** [ ] PASS / [ ] FAIL

**If FAIL:**
- Check URL has query parameters after redirect
- Check booking exists in database
- Run: `window.location.search` to see params

---

## 🌐 Test 4: Network Verification (3 min)

**Action:**
1. DevTools → Network tab
2. Filter by: "google"
3. Complete any booking
4. Look for these requests:

**Expected Requests:**
- [ ] `googletagmanager.com/gtag/js` → Status: 200 OK
- [ ] `google-analytics.com/g/collect` → Status: 200 OK
- [ ] `googleadservices.com/pagead/conversion` → Status: 200 OK

**Result:** [ ] PASS / [ ] FAIL

**If FAIL:** Check for blocked requests (red in Network tab)

---

## 🎯 Test 5: Google Ads Dashboard (After 6-24 hours)

**Action:**
1. Login: https://ads.google.com
2. Navigate: Tools → Conversions
3. Look for conversion actions

**Expected:**
- [ ] "Page view" conversion action exists (Label: vMD-CIrB8dMbEPGx2axC)
- [ ] Purchase conversion action exists
- [ ] Test conversions appear in data
- [ ] Values match test bookings
- [ ] Transaction IDs visible

**Test Transaction IDs to verify:**
1. ___________________
2. ___________________
3. ___________________

**Result:** [ ] PASS / [ ] FAIL

**If FAIL:** Wait 24-72 hours for initial setup

---

## 🧪 Advanced Test: Complete Flow (10 min)

**Action:**
1. Visit: `https://www.dominicantransfers.nl/test-conversion-flow.html`
2. Click "Check System Status" → Should be all ✅
3. Click "Test Click Conversion" → Check log
4. Click "Test Purchase Conversion" → Check log
5. Click "Test Complete Flow" → Watch automated tests

**Expected:**
- [ ] All system checks pass
- [ ] All tests show ✅
- [ ] Console log shows all events
- [ ] No errors in console

**Result:** [ ] PASS / [ ] FAIL

---

## 📊 Quick Diagnostics

### If conversions not firing:

**Check 1: gtag loaded?**
```javascript
console.log(typeof window.gtag);
// Should be: "function"
```

**Check 2: dataLayer exists?**
```javascript
console.log(Array.isArray(window.dataLayer));
// Should be: true
```

**Check 3: Click conversion available?**
```javascript
console.log(typeof window.gtag_report_conversion);
// Should be: "function"
```

**Check 4: On production?**
```javascript
console.log(window.location.hostname);
// Should NOT be: "localhost" or "127.0.0.1"
```

**Check 5: Ad blocker?**
```javascript
// Network tab should show gtag.js loaded
// If blocked, will show as failed request
```

---

## 🚨 Common Issues

### Issue: "Cannot read gtag of undefined"
**Fix:** Disable ad blocker, refresh page

### Issue: Conversion logs but doesn't appear in Google Ads
**Fix:** Wait 6-24 hours, ensure on production URL

### Issue: Stripe return doesn't fire conversion
**Fix:** Check URL has `?booking_success=true` parameter

### Issue: Wrong value sent
**Fix:** Check booking `total_price` in database

### Issue: Multiple conversions for same booking
**Fix:** Check transaction_id is unique (BK-XXXXXX format)

---

## 📝 Test Results Summary

**Date Tested:** ___________________

**Tester:** ___________________

**Results:**
- Installation: [ ] PASS / [ ] FAIL
- Click Conversion: [ ] PASS / [ ] FAIL
- Direct Payment: [ ] PASS / [ ] FAIL
- Stripe Payment: [ ] PASS / [ ] FAIL
- Network Requests: [ ] PASS / [ ] FAIL
- Google Ads Dashboard: [ ] PASS / [ ] FAIL (after 24h)

**Overall Status:** [ ] ✅ ALL TESTS PASSED / [ ] ❌ ISSUES FOUND

**Issues Found:**
_________________________________________________
_________________________________________________
_________________________________________________

**Notes:**
_________________________________________________
_________________________________________________
_________________________________________________

---

## 📞 Need Help?

**Documentation:**
- Full testing guide: `GOOGLE_ADS_AUDIT_AND_TEST.md`
- Troubleshooting: `GOOGLE_ADS_TROUBLESHOOTING.md`
- Setup guide: `GOOGLE_ADS_FINAL_SETUP.md`

**Testing Tools:**
- Basic test: `/test-gtag.html`
- Advanced test: `/test-conversion-flow.html`
- Console: `window.verifyGoogleAds()`

**Support:**
- Google Ads Help: https://support.google.com/google-ads
- Tag Assistant: https://tagassistant.google.com

---

## ✅ Sign-Off

**Tested By:** ___________________

**Date:** ___________________

**Signature:** ___________________

**Status:** [ ] Approved for Production / [ ] Needs Fixes

---

**Print this checklist and complete it during your testing session**
