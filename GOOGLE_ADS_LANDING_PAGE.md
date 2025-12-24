# Google Ads Landing Page - Setup Guide

## Overview

A high-converting landing page has been created specifically for Google Ads campaigns targeting airport transfer searches in Punta Cana and Santo Domingo.

## Features

### CRO Optimized
- **Mobile-first design** with sticky CTA buttons
- **Light mode only** for maximum readability
- **Multiple CTAs** strategically placed throughout the page
- **Trust indicators** prominently displayed
- **Social proof** through features and benefits

### SEO & Quality Score Optimized
- All exact keywords used naturally throughout the page
- H1 matches ad intent exactly
- Keywords in first 100 words
- Semantic HTML structure
- Fast loading with optimized images

### User Experience
- Clean, scannable design
- Short paragraphs and bullet points
- Clear value propositions
- Visual hierarchy guides users to action
- Comparison section (private transfer vs taxi)

## How to Access

### Option 1: URL Parameter
```
https://yourdomain.com/?landing=true
```

### Option 2: Direct Path
```
https://yourdomain.com/landing
```

## Key Features

### 1. Hero Section
- **H1**: "Punta Cana Airport Transfer From $25 – Private PUJ Airport Transfers"
- Two primary CTAs:
  - "Book Your Punta Cana Transfer Now"
  - "Chat for Instant Price"

### 2. Trust Badges Section
- Private airport transfer (no shared rides)
- Meet & greet at PUJ Airport
- Fixed prices – no surprises
- 24/7 availability
- Trusted Dominican airport transfers
- Up to 4 passengers

### 3. Educational Content
- "What is a Punta Cana Airport Transfer?"
- "How Punta Cana Airport Pickup Works" (3-step process)
- "Why Choose Private Transfer Punta Cana Over Airport Taxi?"

### 4. Popular Airport Transfers
30 pre-configured routes that users can click to instantly start booking:

**From Punta Cana (PUJ):**
- Excellence Resorts
- Hilton La Romana
- Hyatt Zilara & Ziva Cap Cana
- Sanctuary Cap Cana
- Dreams Macao
- Bahia Principe Resorts
- Hard Rock Resort
- Majestic Resorts
- Royalton Resorts
- Airbnb locations (Punta Cana, La Romana, Playa Nueva Romana, Samana, Sosua)

**From Santo Domingo (SDQ):**
- La Romana Resorts
- Cap Cana Resorts
- Casa de Campo
- Dreams Resorts
- Excellence Resorts
- Hard Rock Punta Cana
- Samana and Las Terrenas
- Puerto Plata
- Airbnb locations (Santo Domingo, Boca Chica, Juan Dolio, Puerto Plata, Cabarete)

### 5. Vehicle Gallery
High-quality images of the fleet to build trust and show professionalism.

### 6. Multiple CTA Sections
CTAs appear:
- Hero section (2 buttons)
- After trust section
- Mid-page price section
- Final urgent CTA section
- Sticky mobile footer (on mobile devices)

## User Flow

### When "Book Now" is Clicked
1. Landing page disappears
2. Chat interface appears
3. Agent greets user ready to start booking
4. Focus automatically set to chat input

### When a Route is Clicked
1. Landing page disappears
2. Chat interface appears with pre-filled context
3. Input field shows: "I need a transfer from [AIRPORT] to [DESTINATION]"
4. User can press Enter to start booking immediately
5. Agent has airport and destination already captured

## Conversion Tracking

All user actions are tracked via Google Analytics events:
- `landing_page_book_now_clicked` - When any Book Now button is clicked
- `landing_page_route_clicked` - When a specific route is selected
  - Includes `airport` and `destination` parameters

## Google Ads Setup

### Recommended Ad Groups

**Ad Group 1: Punta Cana Airport Transfer**
- Keywords: punta cana airport transfer, private transfer punta cana, punta cana transfer
- Final URL: `https://yourdomain.com/?landing=true`

**Ad Group 2: PUJ to Hotel**
- Keywords: punta cana airport to hotel, airport transfers punta cana, puj transfer
- Final URL: `https://yourdomain.com/?landing=true`

**Ad Group 3: Santo Domingo Airport**
- Keywords: santo domingo airport transfer, sdq transfer, santo domingo to punta cana
- Final URL: `https://yourdomain.com/?landing=true`

### Quality Score Factors

✅ **Landing Page Experience**
- Fast loading time
- Mobile responsive
- Relevant content matching ad keywords
- Clear CTAs
- Trustworthy design

✅ **Expected CTR**
- Multiple CTA opportunities
- Compelling copy
- Social proof elements

✅ **Ad Relevance**
- H1 matches ad copy exactly
- Keywords repeated naturally throughout
- Service description matches user intent

## Testing Checklist

- [ ] Visit `/?landing=true` - Landing page appears
- [ ] Click "Book Now" - Chat appears immediately
- [ ] Click a popular route - Chat appears with pre-filled message
- [ ] Test on mobile - Sticky CTA footer appears
- [ ] Test on desktop - All CTAs visible and functional
- [ ] Verify images load correctly
- [ ] Check all route links work
- [ ] Test conversion tracking in Google Analytics

## Customization

To modify prices, benefits, or content, edit:
```
/src/components/GoogleAdsLanding.tsx
```

## Keywords Included

Primary keywords (1:1 match):
- punta cana transfer
- punta cana airport transfer
- punta cana airport taxi
- private transfer punta cana
- private airport transfers punta cana

Secondary keywords:
- hotel transfer punta cana
- dominican airport transfers
- punta cana airport pickup
- airport transfers from punta cana airport to hotel
- private transportation punta cana airport
- punta cana airport transportation
- punta cana hotel transfers
- punta cana transfers from airport to hotel
- transfer from punta cana airport to hotel

All keywords are used naturally in:
- H1 and H2 headings
- First 100 words
- Body copy
- Section titles
- Meta descriptions (if added)

## Performance

- Mobile-first responsive design
- Lightweight (no heavy frameworks)
- Fast loading with optimized images
- Minimal JavaScript for core functionality
- Accessible with semantic HTML

## Next Steps

1. Test the landing page at `/?landing=true`
2. Set up Google Ads campaigns pointing to this URL
3. Monitor conversion rates via Google Analytics
4. A/B test different headlines or CTAs if needed
5. Adjust pricing or copy based on performance data

## Support

The landing page integrates seamlessly with your existing booking system:
- All chat functionality works normally
- Booking flow unchanged
- Payment processing unaffected
- Admin dashboard tracks these conversions

---

**Created**: December 2024
**Version**: 1.0
**Status**: Ready for Google Ads campaigns
