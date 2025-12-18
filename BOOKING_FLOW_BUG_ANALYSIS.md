# Booking Flow Interruption - Bug Analysis

## Critical Bugs Found

### Bug #1: FAQ Detection Mismatch
**Problem**: `isFAQQuery()` is too simple compared to `isGeneralQuestion()`

**Example Scenario**:
```
User starts booking: "PUJ to Hard Rock"
Agent: "How many passengers?"
User: "Where will I meet my driver at the airport?"

Current Flow:
1. handleBookingFlow() is called
2. isGeneralQuestion() checks line 321: "where will i meet" → TRUE
3. isFAQQuery() checks keywords: "meet", "driver" → TRUE
4. Enters if block: calls handleFAQ() ✅ WORKS

BUT:

User: "What happens after I land at the airport?"

Current Flow:
1. handleBookingFlow() is called
2. isGeneralQuestion() checks line 333: "what happens after i land" → TRUE
3. isFAQQuery() checks keywords: NO MATCH → FALSE
4. Enters if block BUT isFAQQuery is false
5. Calls handleGeneralQuestion() (GPT API) ❌ WRONG!
6. Should call handleFAQ() with specific pickup procedure response
```

**Root Cause**:
- `isGeneralQuestion` has 150+ specific FAQ patterns (lines 317-481)
- `isFAQQuery` only has 20 basic keywords (lines 1170-1177)
- Many FAQ questions match `isGeneralQuestion` but NOT `isFAQQuery`
- These get routed to GPT instead of structured FAQ responses

### Bug #2: Special Handlers Not Available During Booking
**Problem**: Functions like `showInstagramPhotos()`, `showPickupProcedure()`, `showDominicanFunFacts()` only work when NOT in booking flow

**Example Scenario**:
```
User in booking flow: "Can I see photos of your vehicles?"

Current Flow:
1. handleBookingFlow() is called
2. isGeneralQuestion("can i see photos?") → TRUE (line 415: "can you tell")
3. isFAQQuery() → FALSE (no match)
4. Calls handleGeneralQuestion() → GPT response ❌
5. Should call showInstagramPhotos() ✅

The showInstagramPhotos() is only checked in processMessage() line 255,
which is SKIPPED when in booking flow (line 223-224 routes to handleBookingFlow)
```

### Bug #3: Inconsistent Booking Context Display
**Problem**: Different formatting between FAQ and General handlers

**In handleFAQ()** (line 1218):
```
📋 Your booking in progress: Airport: PUJ, Hotel: Hard Rock Hotel
```

**In handleGeneralQuestion()** (line 1248):
```
📋 Your booking in progress: Airport: PUJ, Hotel: Hard Rock Hotel
```

Both use comma-separated format, but resume message uses bullet points. Inconsistent UX.

### Bug #4: "Ask a question" Suggestion Unclear
**Problem**: Suggestion chips say "Ask a question" but don't explain that booking will be paused

**In getSuggestionsForStep()** (line 513):
```typescript
return ['PUJ - Punta Cana', 'SDQ - Santo Domingo', 'LRM - La Romana', 'Ask a question'];
```

User clicks "Ask a question" but doesn't know:
1. Their booking will be paused
2. They can return with "Continue booking"
3. Their progress is saved

### Bug #5: isGeneralQuestion Too Complex
**Problem**: 200+ lines of detection logic makes it slow and hard to maintain

Lines 311-508 contain:
- FAQ keyword detection (should be in isFAQQuery)
- Airport pickup questions (should be in isFAQQuery)
- Question pattern detection
- Booking context detection
- Overlap with isFAQQuery

This causes:
- Confusion about which method handles what
- Performance issues (runs on every message)
- Difficult to debug which pattern matched

## Test Cases That Fail

### Test Case 1: FAIL ❌
```
Step: AWAITING_PASSENGERS
User: "What happens when I arrive at the airport?"
Expected: Specific FAQ response about pickup procedure
Actual: GPT general response (inconsistent, slower)
Reason: isFAQQuery() doesn't match, goes to GPT
```

### Test Case 2: FAIL ❌
```
Step: AWAITING_LUGGAGE
User: "Can I see photos of your vehicles?"
Expected: Instagram photos response
Actual: GPT general response about photos
Reason: showInstagramPhotos() not callable in booking flow
```

### Test Case 3: FAIL ❌
```
Step: AWAITING_VEHICLE_SELECTION
User: "Tell me fun facts about Dominican Republic"
Expected: Specific fun facts response
Actual: GPT general response about DR
Reason: showDominicanFunFacts() not callable in booking flow
```

### Test Case 4: FAIL ❌
```
Step: AWAITING_TRIP_TYPE
User: "How does the pickup process work?"
Expected: Specific pickup procedure response
Actual: Either FAQ or GPT (inconsistent)
Reason: isFAQQuery might not match, showPickupProcedure() not callable
```

### Test Case 5: PASS ✅
```
Step: AWAITING_PASSENGERS
User: "What if my flight is delayed?"
Expected: Flight delay FAQ response
Actual: Flight delay FAQ response
Reason: "delay" keyword matches isFAQQuery()
```

### Test Case 6: FAIL ❌
```
Step: AWAITING_HOTEL
User: "2"
Expected: Invalid response, ask again for hotel
Actual: Might be caught by isGeneralQuestion if ends with "?"
Reason: Over-aggressive pattern matching
```

## Performance Issues

### Issue 1: Double Detection
Every message during booking runs:
1. `isGeneralQuestion()` - 200 lines of checks
2. `isFAQQuery()` - 20 keywords
3. Both check similar patterns

### Issue 2: Redundant Checks
`isGeneralQuestion` contains:
- Lines 317-362: FAQ keywords (duplicate of isFAQQuery concept)
- Lines 369-380: Explicit triggers (already handled)
- Lines 450-481: Airport pickup (duplicate of isFAQQuery concept)

### Issue 3: No Early Returns
`isGeneralQuestion` checks ALL patterns even after finding a match

## Recommended Fix Priority

1. **HIGH PRIORITY**: Consolidate FAQ detection into `isFAQQuery()`
2. **HIGH PRIORITY**: Make special handlers (photos, facts, pickup) available during booking
3. **MEDIUM PRIORITY**: Simplify `isGeneralQuestion()` logic
4. **MEDIUM PRIORITY**: Consistent booking context formatting
5. **LOW PRIORITY**: Better suggestion chip UX
