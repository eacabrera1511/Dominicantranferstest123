# Google Ads Dynamic Landing Page Setup

## Overview

Your chat landing page now dynamically responds to Google Ads URL parameters, showing personalized welcome messages and relevant suggestion buttons based on the search terms that brought visitors to your site.

## How It Works

### Single URL Structure
Use ONE page with query parameters:
```
https://dominicantransfers.com/?arrival=puj&destination={keyword}
```

### URL Parameters

1. **arrival** (optional) - Airport code
   - Example: `puj` (Punta Cana Airport)
   - Displays as: "Punta Cana Airport"

2. **destination** (optional) - Hotel name, resort name, or keyword from Google Ads
   - Example: `hard+rock+hotel`
   - Example: `bavaro+resort`
   - Example: `uvero+alto`

## Dynamic Welcome Messages

The page automatically shows one of three welcome messages:

### 1. Both Arrival + Destination Known
**URL:** `https://dominicantransfers.com/?arrival=puj&destination=hard+rock+hotel`

**Message:**
```
Welcome 👋
Private airport transfer from Punta Cana Airport to hard rock hotel.
```

**Suggestions:**
- PUJ → hard rock hotel
- One-Way Transfer
- Roundtrip Transfer
- See vehicle options
- Get instant quote

### 2. Only Arrival Known
**URL:** `https://dominicantransfers.com/?arrival=puj`

**Message:**
```
Welcome 👋
Private airport transfers from Punta Cana Airport.
```

**Suggestions:**
- PUJ → Hotel / Resort
- One-Way Transfer
- Roundtrip Transfer
- See prices
- View all vehicles

### 3. No Parameters (Fallback)
**URL:** `https://dominicantransfers.com/`

**Message:**
```
Welcome 👋
Private airport transfers in the Dominican Republic.
```

**Suggestions:**
- PUJ → Punta Cana Hotel
- Airport Transfer Quote
- See prices
- View vehicles
- Ask a question

## Google Ads Setup Examples

### Campaign 1: Hotel-Specific Ads
**Search Term:** "punta cana airport to hard rock hotel"

**Final URL:**
```
https://dominicantransfers.com/?arrival=puj&destination=hard+rock+hotel
```

### Campaign 2: Resort-Specific Ads
**Search Term:** "puj airport to bavaro resort"

**Final URL:**
```
https://dominicantransfers.com/?arrival=puj&destination=bavaro+resort
```

### Campaign 3: Generic Transfer Ads
**Search Term:** "punta cana airport transfer"

**Final URL:**
```
https://dominicantransfers.com/?arrival=puj
```

### Campaign 4: Broad Match
**Search Term:** "dominican republic airport transfer"

**Final URL:**
```
https://dominicantransfers.com/
```

## Why This Scores High in Google Ads

✅ **Exact keyword → page message match** - Welcome message directly addresses the search query

✅ **Dynamic hotel/resort relevance** - Personalized for each destination searched

✅ **High engagement** - Interactive chat interface keeps visitors engaged

✅ **Low bounce rate** - Relevant content reduces bounce rate

✅ **No deceptive content** - Honest, straightforward messaging

✅ **One clean URL** - Easy to manage and track

✅ **Policy-safe** - Fully compliant with Google Ads policies

## Using {keyword} in Google Ads

In your Google Ads campaigns, use the `{keyword}` placeholder:

```
Final URL: https://dominicantransfers.com/?arrival=puj&destination={keyword}
```

Google Ads will automatically replace `{keyword}` with the actual search term:
- User searches: "hard rock hotel"
- Final URL becomes: `https://dominicantransfers.com/?arrival=puj&destination=hard+rock+hotel`

## Important Notes

1. **DO NOT create multiple pages** - One page handles all variations
2. **DO NOT hardcode hotel names** - Use URL parameters dynamically
3. **Chat behavior unchanged** - All existing functionality remains the same
4. **Suggestions are visual only** - They don't affect chat logic
5. **Welcome message is display only** - Chat AI handles conversations normally

## Testing URLs

Test your setup with these URLs:

1. **Specific Hotel:**
   ```
   https://dominicantransfers.com/?arrival=puj&destination=hard+rock+hotel
   ```

2. **Specific Resort:**
   ```
   https://dominicantransfers.com/?arrival=puj&destination=bavaro+princess
   ```

3. **Generic Airport:**
   ```
   https://dominicantransfers.com/?arrival=puj
   ```

4. **No Parameters:**
   ```
   https://dominicantransfers.com/
   ```

## Quality Score Optimization

This setup maximizes your Google Ads Quality Score by:

1. **Landing Page Relevance** - Dynamic welcome matches search intent
2. **Expected CTR** - Personalized content increases click-through rates
3. **Ad Relevance** - URL parameters ensure content matches ad copy
4. **User Experience** - Clean design, fast loading, mobile-optimized

## Analytics Tracking

The page automatically tracks:
- URL parameters in analytics
- Chat engagement per source
- Conversion rates by destination keyword
- Google Ads conversion events

All existing Google Ads conversion tracking continues to work normally.
