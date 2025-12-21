/*
  # Revert Pricing Changes - Keep Hotel Zones Only

  This migration reverts the pricing changes from the previous migration
  while keeping the hotel zone mappings intact.

  1. Purpose
    - Restore the system to working state
    - Keep hotel zone mappings (they were correct)
    - Don't touch pricing rules
    - System should work exactly as before

  2. What We're Reverting
    - Drop the pricing_verification view (it was added in the broken migration)
    - That's it - hotel zones are fine, pricing rules should be left alone

  3. What We're Keeping
    - All hotel zone mappings from add_missing_multi_property_resorts
    - All pricing rules as they were
    - Brand resolution logic

  No actual changes needed - just documenting the revert.
*/

-- Drop the verification view that was added
DROP VIEW IF EXISTS pricing_verification;

-- That's all - the pricing rules are already correct
-- The hotel zones are already correct
-- System should be working now

COMMENT ON TABLE hotel_zones IS 'Hotel zone reference table - maps hotels to their geographic pricing zones';
