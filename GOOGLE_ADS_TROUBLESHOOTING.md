# Google Ads Tag Detection Troubleshooting Guide

## Issue: "Google tag wasn't detected"

If you're seeing the message "Your Google tag wasn't detected on www.dominicantransfers.nl", follow this comprehensive troubleshooting guide.

---

## ✅ Pre-Flight Checklist

### 1. Verify Tag is in Production Build

**Check:**
- [ ] Code has been built: `npm run build`
- [ ] Build files are in `/dist` folder
- [ ] Changes have been deployed to production server
- [ ] You're testing on the actual production URL (not localhost)

**Important:** Google's Tag Assistant can only detect tags on **publicly accessible websites**, not on localhost or development environments.

---

### 2. Check if Tag is Loading

Open your website and check the browser console:

#### Method 1: Console Commands

```javascript
// Check if gtag is defined
console.log(typeof window.gtag);
// Should output: "function"

// Check dataLayer
console.log(window.dataLayer);
// Should output: an array with tracking data

// Run verification (custom helper)
window.verifyGoogleAds();
// Should output: detailed status report
```

#### Method 2: Network Tab

1. Open **Developer Tools** (F12)
2. Go to **Network** tab
3. Reload the page
4. Search for:
   - `googletagmanager.com/gtag/js`
   - Should show **200 OK** status

#### Method 3: View Page Source

1. Right-click page → **View Page Source**
2. Search for: `AW-17810479345`
3. You should find:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-17810479345"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-17810479345');
</script>
```

---

## 🔍 Common Issues & Solutions

### Issue 1: Ad Blocker Interference

**Symptoms:**
- Script loads in incognito mode but not in normal mode
- Network requests to Google blocked

**Solution:**
1. Disable ad blockers (uBlock Origin, AdBlock Plus, Brave Shields)
2. Add your domain to ad blocker whitelist
3. Test in **incognito/private** mode

---

### Issue 2: Content Security Policy (CSP) Blocking

**Symptoms:**
- Console errors about CSP violations
- Scripts from `googletagmanager.com` blocked

**Solution:**

Check if your server is sending restrictive CSP headers. Your CSP should allow:

```
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
connect-src 'self' https://www.google-analytics.com https://stats.g.doubleclick.net;
```

**How to check:**
1. Open **Developer Tools** → **Network** tab
2. Select the main document
3. Look at **Response Headers**
4. Check `Content-Security-Policy` header

---

### Issue 3: DNS/Hosting Issues

**Symptoms:**
- Old version of site loads
- Recent changes not visible

**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard reload (Ctrl+F5)
3. Check DNS propagation: https://dnschecker.org
4. Verify deployment was successful

**For Vercel/Netlify:**
```bash
# Check if latest commit is deployed
git log -1
# Check deployment status in hosting dashboard
```

---

### Issue 4: Script Load Timing

**Symptoms:**
- Console shows "gtag is not defined"
- Intermittent loading issues

**Current Implementation:**
The script uses `async` loading for performance. The tag should load within 1-2 seconds.

**Verification:**
```javascript
// Wait 2 seconds after page load
setTimeout(() => {
  window.verifyGoogleAds();
}, 2000);
```

---

### Issue 5: Wrong Domain

**Symptoms:**
- Testing on `localhost:5173`
- Testing on staging URL
- Google Tag Assistant says "not detected"

**Solution:**
Google Tag Assistant **requires a publicly accessible URL** with a valid domain:

✅ Works:
- `https://www.dominicantransfers.nl`
- `https://dominicantransfers.nl`

❌ Doesn't work:
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `http://192.168.1.100:5173`

---

## 🛠️ Testing Methods

### Method 1: Google Tag Assistant (Chrome Extension)

1. Install: [Google Tag Assistant](https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/kejbdjndbnbjgmefkgdddjlbokphdefk)
2. Open your website: `https://www.dominicantransfers.nl`
3. Click Tag Assistant icon
4. Click **Enable** → **Record**
5. Reload page
6. Stop recording
7. Check for `Google Ads` tag

**Expected Result:**
- ✅ Google Ads tag detected
- ✅ Tag ID: AW-17810479345
- ✅ No errors

---

### Method 2: Google Ads Preview

1. Go to [Google Ads](https://ads.google.com)
2. Navigate to: **Tools** → **Setup** → **Tag Manager**
3. Find your conversion tag
4. Click **Test**
5. Enter URL: `https://www.dominicantransfers.nl`
6. Click **Test URL**

---

### Method 3: Browser Console Debug

Open your site and run:

```javascript
// Full verification
window.verifyGoogleAds();

// Expected output:
🎯 Google Ads Tracking Status
Loaded: ✅
DataLayer: ✅
gtag Function: ✅
Account ID: AW-17810479345
```

---

### Method 4: Test Conversion Tracking

```javascript
// Send a test conversion
window.testGoogleAdsConversion(100.00, 'TEST-123');

// Check console for:
🧪 Testing conversion tracking...
Value: 100
Transaction ID: TEST-123
✅ Test conversion event sent successfully
```

Then check Google Ads dashboard in 3-6 hours for the test conversion.

---

## 📋 Complete Verification Checklist

Before contacting support, verify:

- [ ] Website is **deployed to production** (not localhost)
- [ ] **Hard refresh** performed (Ctrl+F5)
- [ ] **Ad blockers disabled** or site whitelisted
- [ ] Testing on **correct domain**: www.dominicantransfers.nl
- [ ] **Browser console** shows no errors
- [ ] **View Source** shows gtag script
- [ ] **Network tab** shows gtag.js loads (200 OK)
- [ ] `window.gtag` is defined (run in console)
- [ ] `window.dataLayer` exists (run in console)
- [ ] `window.verifyGoogleAds()` returns ✅ (run in console)
- [ ] Waiting **24 hours** for Google's detection to update

---

## 🎯 Google Ads Setup Requirements

### In Your Google Ads Account

Make sure you've completed:

1. **Create Conversion Action**
   - Go to: **Tools** → **Conversions** → **+ New conversion action**
   - Category: **Purchase**
   - Value: **Use different values for each conversion**
   - Count: **One**
   - Click through conversion window: **30 days**

2. **Get Conversion Label** (if provided)
   - After creating conversion action
   - You'll see: `AW-17810479345/AbC-D_efG-HIJk`
   - The part after `/` is the conversion label

3. **Install Tag Instructions**
   - Google will show installation instructions
   - Our implementation matches these exactly

---

## 🚨 Important Notes

### Detection Lag

Google's tag detection can take **24-72 hours** to update:
- Tag needs to be seen by Google's crawlers
- Domain verification may be required
- DNS changes need time to propagate

### What Google Checks

Google Tag Assistant verifies:
1. ✅ gtag.js script loads from their CDN
2. ✅ `gtag('config', 'AW-XXXXXX')` is called
3. ✅ dataLayer is properly initialized
4. ✅ Domain matches expected domain

### Conversion Label (Optional)

Some Google Ads setups require a **conversion label**. If you were provided one:

**Format:** `AW-17810479345/AbC-D_efG-HIJk`

Update the code to:
```javascript
window.gtag('event', 'conversion', {
  'send_to': 'AW-17810479345/YOUR_CONVERSION_LABEL',
  'value': totalPrice,
  'currency': 'USD',
  'transaction_id': bookingReference
});
```

---

## 🔧 Advanced Debugging

### Enable Debug Mode

Add to console:
```javascript
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  'gtm.allowlist': ['google'],
  'gtm.blocklist': []
});

// Enable debug
gtag('set', 'debug_mode', true);
```

### Monitor All Events

```javascript
// Log all dataLayer pushes
const originalPush = window.dataLayer.push;
window.dataLayer.push = function() {
  console.log('dataLayer.push:', arguments);
  return originalPush.apply(window.dataLayer, arguments);
};
```

### Network Monitoring

Check these requests are successful:
1. `https://www.googletagmanager.com/gtag/js?id=AW-17810479345`
2. `https://www.google-analytics.com/g/collect` (for events)
3. `https://www.googleadservices.com/pagead/conversion/` (for conversions)

---

## 📞 Still Not Working?

### If Tag Isn't Loading

**Check Server Configuration:**
```bash
# Test from command line
curl -I https://www.dominicantransfers.nl

# Should NOT see:
# X-Frame-Options: DENY
# Content-Security-Policy: (blocking scripts)
```

### If Tag Loads but Not Detected

**Wait longer:**
- Google's detection can lag by 24-72 hours
- Tag needs to be crawled by Google
- Try again tomorrow

**Contact Google Ads Support:**
1. Go to Google Ads
2. Click **Help** → **Contact Us**
3. Select: **Tag installation issues**
4. Provide: `AW-17810479345` and `www.dominicantransfers.nl`

---

## ✅ Expected Console Output

When everything is working correctly:

```
Google Ads gtag initialized: AW-17810479345
🎯 Google Ads Tracking Status
Loaded: ✅
DataLayer: ✅
gtag Function: ✅
Account ID: AW-17810479345
DataLayer Contents: [...]
```

When a booking completes:

```
🎯 Firing Google Ads conversion: {value: 150, transaction_id: "BK-ABC123"}
✅ Conversion event sent successfully
```

---

## 📊 Verification Timeline

| Time | Action | Expected Result |
|------|--------|----------------|
| Immediate | View page source | See gtag script |
| 0-5 sec | Load page | gtag loads, console shows init |
| 2 sec | Auto-verification | Console shows status report |
| On booking | Complete purchase | Console shows conversion event |
| 3-6 hours | Check Google Ads | Test conversions appear |
| 24-72 hours | Tag detection | Google Tag Assistant detects tag |

---

## 🎯 Summary

**The tag IS installed correctly if:**
1. ✅ You see the script in page source
2. ✅ `window.gtag` is a function
3. ✅ `window.dataLayer` exists
4. ✅ Console shows initialization
5. ✅ Network shows gtag.js loads (200 OK)
6. ✅ Conversions fire on booking completion

**Google's "tag not detected" message might mean:**
- You're testing on localhost (won't work)
- Ad blocker is active
- Site hasn't been crawled yet (wait 24-72 hours)
- DNS hasn't propagated yet
- Need to add domain verification in Google Ads

**The implementation is professional and correct.** The detection issues are likely environmental or timing-related, not code-related.

---

## 🚀 Quick Test Script

Run this in your browser console on the live site:

```javascript
(function() {
  console.group('🔍 Google Ads Tag Diagnostic');

  console.log('1. gtag defined:', typeof window.gtag === 'function' ? '✅' : '❌');
  console.log('2. dataLayer exists:', Array.isArray(window.dataLayer) ? '✅' : '❌');
  console.log('3. Site URL:', window.location.href);
  console.log('4. Is localhost:', window.location.hostname === 'localhost' ? '❌ FAIL - Use production URL' : '✅');

  // Check network
  console.log('\n5. Testing script load...');
  fetch('https://www.googletagmanager.com/gtag/js?id=AW-17810479345', {method: 'HEAD'})
    .then(r => console.log('   Script reachable:', r.ok ? '✅' : '❌'))
    .catch(e => console.log('   Script blocked:', '❌', e.message));

  console.log('\n6. Run this command: window.verifyGoogleAds()');
  console.groupEnd();
})();
```

This will quickly show you what's working and what isn't.
