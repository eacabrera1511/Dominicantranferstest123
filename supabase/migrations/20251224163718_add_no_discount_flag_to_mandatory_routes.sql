/*
  # Add No-Discount Flag for Mandatory Pricing Routes

  1. Changes
    - Add `no_discount_allowed` boolean column to pricing_rules table
    - Set it to true for all mandatory pricing routes (priority 999)
    - This prevents admin discounts from being applied to these routes
  
  2. Security
    - No RLS changes needed (existing policies apply)
*/

-- Add no_discount_allowed column to pricing_rules
ALTER TABLE pricing_rules 
ADD COLUMN IF NOT EXISTS no_discount_allowed boolean DEFAULT false;

-- Mark all mandatory pricing routes (priority 999) as no-discount-allowed
UPDATE pricing_rules 
SET no_discount_allowed = true
WHERE priority = 999;

-- Add comment for documentation
COMMENT ON COLUMN pricing_rules.no_discount_allowed IS 'When true, global discounts cannot be applied to this pricing rule';
