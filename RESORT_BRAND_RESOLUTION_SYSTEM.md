# Resort Brand Resolution System

**Date:** December 21, 2024
**Status:** ✅ IMPLEMENTED & OPERATIONAL

---

## 🎯 Problem Solved

Many resort brands in the Dominican Republic operate multiple physical properties in different geographic zones. Previously, when a user mentioned a brand like "RIU" or "Dreams," the system couldn't determine:

- Which exact property they meant
- Which transfer zone to use
- Which vehicle prices to apply
- What route to calculate

This caused **incorrect pricing** and **wrong route calculations**.

---

## ✅ Solution Implemented

### 1. Database Schema Updates

**New Columns Added to `hotel_zones` Table:**
```sql
brand_name              TEXT              -- Resort brand name (e.g., "RIU Hotels & Resorts")
requires_resolution     BOOLEAN           -- Whether disambiguation is needed
```

**New Columns Added to `bookings` Table:**
```sql
resort_property_id      UUID              -- References hotel_zones(id)
property_resolved       BOOLEAN           -- Whether exact property is confirmed
```

**New Database Function:**
```sql
check_brand_requires_resolution(input_text TEXT)
```
Returns whether a hotel input requires property-level resolution before pricing.

---

### 2. Brand Mapping

The following multi-property brands are now tracked:

| Brand | Properties in System | Resolution Required |
|-------|---------------------|-------------------|
| **Bahia Principe** | 1 | ❌ No |
| **RIU Hotels & Resorts** | 3 | ✅ Yes |
| **Barceló Hotels & Resorts** | 3 | ✅ Yes |
| **Iberostar Hotels & Resorts** | 2 | ✅ Yes |
| **Palladium Hotel Group** | 3 | ✅ Yes |
| **Dreams Resorts & Spa** | 4 | ✅ Yes |
| **Secrets Resorts & Spas** | 2 | ✅ Yes |
| **Excellence Collection** | 1 | ❌ No |
| **Meliá / Paradisus** | 4 | ✅ Yes |
| **Occidental Hotels** | 1 | ❌ No |
| **Catalonia Hotels & Resorts** | 1 | ❌ No |
| **Royalton** | 3 | ✅ Yes |
| **Lopesan** | 1 | ❌ No |
| **Majestic Resorts** | 3 | ✅ Yes |
| **Viva Wyndham** | 1 | ❌ No |
| **Nickelodeon Hotels & Resorts** | 1 | ❌ No |

---

### 3. System Logic Flow

#### **Before (The Bug):**
```
User: "I need a transfer to RIU"
System: ❌ Guesses RIU Palace Bavaro (wrong!)
System: ❌ Applies Zone A pricing (incorrect if user meant RIU Republica)
System: ❌ Books wrong route
```

#### **After (The Fix):**
```
User: "I need a transfer to RIU"
System: ✅ Detects "RIU" is a multi-property brand
System: ✅ Shows all 3 RIU properties with their zones:
        • RIU Palace Bavaro (Zone A - Bavaro / Punta Cana)
        • RIU Palace Punta Cana (Zone A - Bavaro / Punta Cana)
        • RIU Republica (Zone A - Bavaro / Punta Cana)
User: "RIU Palace Bavaro"
System: ✅ Sets resort_property_id
System: ✅ Sets property_resolved = true
System: ✅ Applies correct Zone A pricing
System: ✅ Continues with passengers question
```

---

### 4. New Conversation State

**Added: `AWAITING_PROPERTY_RESOLUTION`**

This state is activated when:
- User mentions a brand with multiple properties
- System can't determine which specific property
- Pricing cannot proceed without resolution

**What Happens:**
1. System stores all matching properties in `context.pending_properties`
2. System stores brand name in `context.pending_brand`
3. System displays numbered list of all matching properties
4. System waits for user to select one
5. Once selected, system sets `resort_property_id` and continues

---

### 5. Code Changes

**New Interface Properties:**
```typescript
interface HotelZone {
  id: string;
  hotel_name: string;
  zone_code: string;
  zone_name: string;
  search_terms: string[];
  is_active: boolean;
  brand_name?: string;           // ← NEW
  requires_resolution?: boolean; // ← NEW
}
```

**New Context Properties:**
```typescript
interface BookingContext {
  step: BookingStep;
  airport?: string;
  hotel?: string;
  region?: string;
  resort_property_id?: string;     // ← NEW
  property_resolved?: boolean;     // ← NEW
  pending_brand?: string;          // ← NEW
  pending_properties?: HotelZone[]; // ← NEW
  // ... existing properties
}
```

**New Methods:**
```typescript
// Checks if brand requires property resolution
private async checkBrandResolution(query: string): Promise<{
  requiresResolution: boolean;
  brand?: string;
  properties?: HotelZone[]
}>

// Handles user selection from property list
private handlePropertyResolution(query: string): AgentResponse
```

---

## 🧪 Testing Examples

### Example 1: RIU Brand Resolution

**Test Input:**
```
User: "PUJ to RIU"
```

**Expected Output:**
```
I found multiple RIU properties in the Dominican Republic. Which one are you going to?

• RIU Palace Bavaro (Bavaro / Punta Cana)
• RIU Palace Punta Cana (Bavaro / Punta Cana)
• RIU Republica (Bavaro / Punta Cana)

Please select one of the properties above.

[Suggestion Chips: RIU Palace Bavaro | RIU Palace Punta Cana | RIU Republica | Ask a question]
```

**User Selects:**
```
User: "RIU Palace Bavaro"
```

**System Response:**
```
Excellent! Transfer from Punta Cana International Airport to RIU Palace Bavaro.

How many passengers will be traveling? (including children)

[Suggestion Chips: 1 passenger | 2 passengers | 3-4 passengers | 5-6 passengers]
```

---

### Example 2: Dreams Brand Resolution

**Test Input:**
```
User: "Airport to Dreams resort"
```

**Expected Output:**
```
Which airport will you be arriving at?

[Suggestion Chips: PUJ - Punta Cana | SDQ - Santo Domingo | LRM - La Romana | POP - Puerto Plata]
```

**User Response:**
```
User: "PUJ"
```

**System Detects Multiple Dreams Properties:**
```
I found multiple DREAMS properties in the Dominican Republic. Which one are you going to?

• Dreams Royal Beach (Bavaro / Punta Cana)
• Dreams Macao Beach (Uvero Alto)
• Dreams Dominicus (Bayahibe)
• Dreams Cap Cana (Cap Cana)

Please select one of the properties above.
```

**User Selects:**
```
User: "Dreams Macao Beach"
```

**System Sets:**
```typescript
context.resort_property_id = "uuid-for-dreams-macao"
context.property_resolved = true
context.hotel = "Dreams Macao Beach"
context.region = "Uvero Alto"  // ← This determines Zone C pricing!
```

**System Continues:**
```
Excellent! Transfer from Punta Cana International Airport to Dreams Macao Beach.

How many passengers will be traveling?
```

---

### Example 3: Specific Property (No Resolution Needed)

**Test Input:**
```
User: "PUJ to RIU Palace Bavaro"
```

**System Response:**
```typescript
// findHotelInDatabase() finds exact match
context.resort_property_id = "uuid-for-riu-palace-bavaro"
context.property_resolved = true
context.hotel = "RIU Palace Bavaro"
context.region = "Bavaro / Punta Cana"
```

**Output:**
```
Excellent! Transfer from Punta Cana International Airport to RIU Palace Bavaro.

How many passengers will be traveling?
```

**No disambiguation needed!** ✅

---

### Example 4: Single-Property Brand (No Resolution Needed)

**Test Input:**
```
User: "PUJ to Nickelodeon"
```

**System Response:**
```typescript
// Only 1 Nickelodeon property exists
// No resolution required
context.resort_property_id = "uuid-for-nickelodeon"
context.property_resolved = true
context.hotel = "Nickelodeon Resort"
context.region = "Uvero Alto"
```

**Output:**
```
Excellent! Transfer from Punta Cana International Airport to Nickelodeon Resort.

How many passengers will be traveling?
```

---

## 🔒 Safety Guarantees

### Hard System Rules

**Rule 1: No Pricing Without Property Resolution**
```typescript
// Price calculation ONLY happens when:
if (context.resort_property_id && context.property_resolved) {
  // Calculate price based on exact zone
  const pricingRule = pricingRules.find(
    rule => rule.origin === airport &&
            rule.destination === region &&
            rule.vehicle_type_id === vehicleTypeId
  );
}
```

**Rule 2: No Guessing**
```typescript
// System NEVER assumes a property
// System NEVER defaults to "nearest location"
// System NEVER uses "Punta Cana" as fallback for all brands
```

**Rule 3: Zone-Based Pricing Integrity**
```typescript
// Each property has a fixed zone:
Dreams Macao Beach    → Zone C (Uvero Alto) → Higher pricing
Dreams Royal Beach    → Zone A (Bavaro)     → Lower pricing
Dreams Cap Cana       → Zone B (Cap Cana)   → Medium pricing
Dreams Dominicus      → Zone D (Bayahibe)   → Highest pricing

// Price CANNOT be calculated without knowing exact property!
```

---

## 📊 Database Query Examples

### Check if Brand Requires Resolution

```sql
SELECT * FROM check_brand_requires_resolution('RIU');
```

**Returns:**
```
requires_resolution | brand_name | matching_properties
--------------------|------------|---------------------
true                | riu        | [{"id": "...", "property_name": "RIU Palace Bavaro", "zone": "Bavaro / Punta Cana"}, ...]
```

### Get All Properties for a Brand

```sql
SELECT id, hotel_name, zone_name, zone_code
FROM hotel_zones
WHERE brand_name ILIKE '%Dreams%'
  AND is_active = true;
```

**Returns:**
```
id                                   | hotel_name           | zone_name         | zone_code
-------------------------------------|----------------------|-------------------|----------
uuid-1                               | Dreams Royal Beach   | Bavaro / Punta Cana | Zone A
uuid-2                               | Dreams Macao Beach   | Uvero Alto        | Zone C
uuid-3                               | Dreams Cap Cana      | Cap Cana          | Zone B
uuid-4                               | Dreams Dominicus     | Bayahibe          | Zone D
```

---

## 🎯 Impact on Pricing

### Before Property Resolution:
```
❌ Cannot determine zone
❌ Cannot lookup pricing rule
❌ Cannot show vehicle options
❌ Cannot calculate route
```

### After Property Resolution:
```
✅ Exact zone known (e.g., "Uvero Alto" = Zone C)
✅ Correct pricing rule applied
✅ Accurate vehicle prices shown:
   - Sedan: $40 (Zone C price, not Zone A)
   - Minivan: $65
   - Suburban: $90
✅ Correct route calculated
```

---

## 🔍 Admin Visibility

### Booking Record Includes:
```sql
SELECT
  booking_reference,
  hotel_name,               -- "Dreams Macao Beach"
  resort_property_id,       -- UUID reference
  property_resolved,        -- true/false
  zone,                     -- "Zone C"
  transfer_route,           -- "PUJ to Uvero Alto"
  total_price               -- Correct Zone C pricing
FROM bookings
WHERE booking_reference = 'BOOK-12345';
```

**Audit Trail:**
- Every booking shows which exact property was selected
- `property_resolved = true` confirms disambiguation happened
- Zone and pricing can be verified against property location

---

## 🚀 Next Steps for Adding New Multi-Property Brands

If a new brand with multiple properties is added to the Dominican Republic:

### Step 1: Add Properties to `hotel_zones`
```sql
INSERT INTO hotel_zones (hotel_name, zone_code, zone_name, search_terms, brand_name, is_active)
VALUES
('Brand Property 1', 'Zone A', 'Bavaro / Punta Cana', ARRAY['brand', 'property 1'], 'Brand Name', true),
('Brand Property 2', 'Zone C', 'Uvero Alto', ARRAY['brand', 'property 2'], 'Brand Name', true);
```

### Step 2: Add Brand to Resolution Check
Update `checkBrandResolution()` method in `travelAgent.ts`:
```typescript
const multiBrandKeywords = [
  // ... existing brands
  'new brand name', 'brand keyword'
];
```

### Step 3: Test
```
User: "PUJ to Brand"
Expected: System shows list of Brand Property 1 and Brand Property 2
User: "Brand Property 1"
Expected: System sets resort_property_id and continues
```

---

## ✅ Summary

| Feature | Status |
|---------|--------|
| Database schema updated | ✅ Done |
| Brand mapping complete | ✅ Done |
| Property resolution logic | ✅ Done |
| Conversation state handling | ✅ Done |
| Pricing integrity enforced | ✅ Done |
| No guessing/defaulting | ✅ Done |
| Exact zone determination | ✅ Done |
| Multi-property brand detection | ✅ Done |
| Single-property brands work | ✅ Done |
| Specific property names work | ✅ Done |
| Admin audit trail | ✅ Done |

---

**All resort brand resolution requirements are now implemented and operational!** 🎉

The system will:
- ✅ Detect multi-property brands
- ✅ Ask for clarification
- ✅ Wait for user selection
- ✅ Apply correct zone-based pricing
- ✅ Never guess or default

**No more incorrect pricing due to brand ambiguity!** 🎯
