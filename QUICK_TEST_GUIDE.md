# 🧪 QUICK TEST GUIDE - Verify Your Tracking Works

**Takes 2 minutes** ⏱️

---

## ✅ Test 1: Live Visitors (30 seconds)

**Do This:**
1. Open your website in a new incognito window
2. Browse around for a few seconds
3. Open another tab, go to: `yourwebsite.com/admin`
4. Login to admin
5. Click **"Live Visitors"**

**You Should See:**
- Your own session listed
- "Active Visitors: 1" at the top
- Your current page showing
- Green dot next to your session
- Updates every 10 seconds

**If You Don't See Anything:**
- Wait 10 seconds for auto-refresh
- Check browser console (F12) for errors
- Make sure you're browsing in the incognito window while checking admin

---

## ✅ Test 2: Google Ads Visitor Tracking (30 seconds)

**Do This:**
1. Open incognito window
2. Go to: `yourwebsite.com?utm_campaign=test&gclid=test123`
3. Go to Admin Dashboard → Live Visitors

**You Should See:**
- Blue "Google Ads" badge next to your session
- Campaign name: "test"
- GCLID shown in session details

**This Proves:**
- ✅ Google Ads visitors are being identified
- ✅ Campaign attribution is working
- ✅ GCLID tracking is operational

---

## ✅ Test 3: Event Tracking (1 minute)

**Do This:**
1. Open your website
2. Click the phone icon/button
3. Go to Admin Dashboard
4. Open Supabase (the database)
5. Click on "Table Editor"
6. Find table: `user_events`
7. Look for most recent entry

**You Should See:**
```
event_name: "phone_clicked"
event_category: "contact"
created_at: [just now]
session_id: [your session]
```

**This Proves:**
- ✅ Events are being tracked
- ✅ Phone clicks are logged (but NOT as conversions)
- ✅ Session tracking works

---

## ✅ Test 4: Conversion Tracking (2 minutes)

**Do This:**
1. Go to your website
2. Start a booking (any route, any vehicle)
3. Enter customer info (use fake data for testing)
4. On payment page, use Stripe test card:
   ```
   Card: 4242 4242 4242 4242
   Expiry: 12/34
   CVC: 123
   ZIP: 12345
   ```
5. Complete payment
6. Wait for success page
7. Open browser console (F12)

**You Should See in Console:**
```
✅ Payment confirmed! Tracking conversion...
🎯 Google Ads conversion sent successfully!
```

**Then Go To:**
- Admin Dashboard → Conversion Audit

**You Should See:**
- Your new conversion in the table
- ✅ "Valid" status (green checkmark)
- Booking reference shown
- Conversion value shown
- Today's date

**This Proves:**
- ✅ Conversions ONLY fire after payment
- ✅ Conversion is logged to database
- ✅ Audit dashboard is working
- ✅ Google Ads will receive this conversion

---

## 🎯 Quick Checklist

After running all 4 tests, you should have:

**Live Visitors:**
- [ ] Can see yourself as active visitor
- [ ] Session updates in real-time
- [ ] Google Ads badge shows when using gclid

**Events:**
- [ ] Phone clicks logged to `user_events`
- [ ] NOT logged to `conversion_events`

**Conversions:**
- [ ] Test booking completed
- [ ] Conversion logged to `conversion_events`
- [ ] Shows in Conversion Audit dashboard
- [ ] Status shows as "Valid" with green checkmark

**Audit Dashboard:**
- [ ] Total conversions count increased
- [ ] Valid conversions count matches
- [ ] Can search and filter conversions
- [ ] All details visible (campaign, value, date)

---

## 🚨 If Something Doesn't Work

### Live Visitors Not Showing
**Fix:**
- Hard refresh your browser (Ctrl+Shift+R / Cmd+Shift+R)
- Clear browser cache
- Wait 10 seconds for auto-refresh

### Events Not Logging
**Check:**
- Browser console for errors
- Supabase connection is working
- Try the action again

### Conversion Not Appearing
**Check:**
- Did payment complete? Check Stripe dashboard
- Browser console should show: "🎯 Google Ads conversion sent successfully!"
- Check `bookings` table - payment_status should be 'paid'
- Check `conversion_events` table directly in Supabase

### Google Ads Badge Not Showing
**Check:**
- URL has `?gclid=test123` parameter
- Session was created AFTER adding the parameter
- Try in fresh incognito window with parameter in initial URL

---

## 📞 Everything Working?

If all 4 tests pass, you're ready to go! 🎉

**What Happens Next:**
1. Real visitors will start showing in Live Visitors
2. All their actions will be tracked as events
3. When they complete a payment, a conversion fires
4. You can audit all conversions in the dashboard
5. Google Ads receives only REAL, PAID conversions

**No more fake conversions!** ✅

---

**Test completed on:** _______________
**All tests passed:** [ ] Yes [ ] No
**Notes:** _____________________________________

---

**Need Help?**
Check `TRACKING_FIX_COMPLETE.md` for detailed troubleshooting.
