/*
  # MASTER PROMPT PRICING OVERRIDE - SINGLE SOURCE OF TRUTH

  This migration implements the exact pricing structure from the Master Prompt.
  All previous pricing is overridden by this authoritative definition.

  ## New Pricing Structure

  ### PUJ → Hotel Zones
  - Zone A (Bavaro / Punta Cana): Sedan $25, Minivan $45, Suburban $65, Sprinter $110, Mini Bus $180
  - Zone B (Cap Cana): Sedan $30, Minivan $50, Suburban $75, Sprinter $120, Mini Bus $190
  - Zone C (Uvero Alto): Sedan $40, Minivan $65, Suburban $90, Sprinter $135, Mini Bus $210
  - Zone D (Bayahibe): Sedan $55, Minivan $80, Suburban $110, Sprinter $160, Mini Bus $240

  ### SDQ → Hotel Zones
  - Zone A (Bavaro / Punta Cana): Sedan $190, Minivan $230, Suburban $300, Sprinter $380, Mini Bus $520
  - Zone B (Cap Cana): Sedan $200, Minivan $250, Suburban $320, Sprinter $400, Mini Bus $550
  - Zone C (Uvero Alto): Sedan $220, Minivan $270, Suburban $350, Sprinter $420, Mini Bus $580
  - Zone D (Bayahibe): Sedan $240, Minivan $290, Suburban $380, Sprinter $450, Mini Bus $620

  ### PUJ ↔ SDQ Direct
  - Sedan $220, Minivan $260, Suburban $320, Sprinter $420, Mini Bus $600

  ## Important Notes
  - Roundtrip = One-Way × 1.9
  - VIP Multiplier = 1.35 (for Suburban and higher with luxury keywords)
  - All prices are in USD
  - Hotel-specific pricing is NOT allowed
  - ALL pricing is strictly by Airport → Zone → Vehicle
*/

-- Delete existing PUJ and SDQ pricing rules
DELETE FROM pricing_rules WHERE origin IN ('PUJ', 'SDQ');

-- PUJ → Bavaro / Punta Cana (Zone A)
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, vehicle_type_id, base_price, zone, is_active, priority)
VALUES
  ('PUJ-BavaroPuntaCana-Sedan', 'zone_to_zone', 'PUJ', 'Bavaro / Punta Cana', '0739d0f4-8077-4918-846b-f6d62acc5e18', 25, 'Zone A', true, 1),
  ('PUJ-BavaroPuntaCana-Minivan', 'zone_to_zone', 'PUJ', 'Bavaro / Punta Cana', 'd3bb2d95-beba-437d-a204-c628b80e0171', 45, 'Zone A', true, 1),
  ('PUJ-BavaroPuntaCana-Suburban', 'zone_to_zone', 'PUJ', 'Bavaro / Punta Cana', 'cf567eae-5335-44ad-96f2-12d25b37c5c1', 65, 'Zone A', true, 1),
  ('PUJ-BavaroPuntaCana-Sprinter', 'zone_to_zone', 'PUJ', 'Bavaro / Punta Cana', 'a431b998-0fec-4dd8-b576-579ae84f456a', 110, 'Zone A', true, 1),
  ('PUJ-BavaroPuntaCana-MiniBus', 'zone_to_zone', 'PUJ', 'Bavaro / Punta Cana', '86fde54a-6260-41e6-b1ab-95b99af44a3d', 180, 'Zone A', true, 1);

-- PUJ → Cap Cana (Zone B)
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, vehicle_type_id, base_price, zone, is_active, priority)
VALUES
  ('PUJ-CapCana-Sedan', 'zone_to_zone', 'PUJ', 'Cap Cana', '0739d0f4-8077-4918-846b-f6d62acc5e18', 30, 'Zone B', true, 1),
  ('PUJ-CapCana-Minivan', 'zone_to_zone', 'PUJ', 'Cap Cana', 'd3bb2d95-beba-437d-a204-c628b80e0171', 50, 'Zone B', true, 1),
  ('PUJ-CapCana-Suburban', 'zone_to_zone', 'PUJ', 'Cap Cana', 'cf567eae-5335-44ad-96f2-12d25b37c5c1', 75, 'Zone B', true, 1),
  ('PUJ-CapCana-Sprinter', 'zone_to_zone', 'PUJ', 'Cap Cana', 'a431b998-0fec-4dd8-b576-579ae84f456a', 120, 'Zone B', true, 1),
  ('PUJ-CapCana-MiniBus', 'zone_to_zone', 'PUJ', 'Cap Cana', '86fde54a-6260-41e6-b1ab-95b99af44a3d', 190, 'Zone B', true, 1);

-- PUJ → Uvero Alto (Zone C)
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, vehicle_type_id, base_price, zone, is_active, priority)
VALUES
  ('PUJ-UveroAlto-Sedan', 'zone_to_zone', 'PUJ', 'Uvero Alto', '0739d0f4-8077-4918-846b-f6d62acc5e18', 40, 'Zone C', true, 1),
  ('PUJ-UveroAlto-Minivan', 'zone_to_zone', 'PUJ', 'Uvero Alto', 'd3bb2d95-beba-437d-a204-c628b80e0171', 65, 'Zone C', true, 1),
  ('PUJ-UveroAlto-Suburban', 'zone_to_zone', 'PUJ', 'Uvero Alto', 'cf567eae-5335-44ad-96f2-12d25b37c5c1', 90, 'Zone C', true, 1),
  ('PUJ-UveroAlto-Sprinter', 'zone_to_zone', 'PUJ', 'Uvero Alto', 'a431b998-0fec-4dd8-b576-579ae84f456a', 135, 'Zone C', true, 1),
  ('PUJ-UveroAlto-MiniBus', 'zone_to_zone', 'PUJ', 'Uvero Alto', '86fde54a-6260-41e6-b1ab-95b99af44a3d', 210, 'Zone C', true, 1);

-- PUJ → Bayahibe (Zone D)
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, vehicle_type_id, base_price, zone, is_active, priority)
VALUES
  ('PUJ-Bayahibe-Sedan', 'zone_to_zone', 'PUJ', 'Bayahibe', '0739d0f4-8077-4918-846b-f6d62acc5e18', 55, 'Zone D', true, 1),
  ('PUJ-Bayahibe-Minivan', 'zone_to_zone', 'PUJ', 'Bayahibe', 'd3bb2d95-beba-437d-a204-c628b80e0171', 80, 'Zone D', true, 1),
  ('PUJ-Bayahibe-Suburban', 'zone_to_zone', 'PUJ', 'Bayahibe', 'cf567eae-5335-44ad-96f2-12d25b37c5c1', 110, 'Zone D', true, 1),
  ('PUJ-Bayahibe-Sprinter', 'zone_to_zone', 'PUJ', 'Bayahibe', 'a431b998-0fec-4dd8-b576-579ae84f456a', 160, 'Zone D', true, 1),
  ('PUJ-Bayahibe-MiniBus', 'zone_to_zone', 'PUJ', 'Bayahibe', '86fde54a-6260-41e6-b1ab-95b99af44a3d', 240, 'Zone D', true, 1);

-- SDQ → Bavaro / Punta Cana (Zone A)
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, vehicle_type_id, base_price, zone, is_active, priority)
VALUES
  ('SDQ-BavaroPuntaCana-Sedan', 'zone_to_zone', 'SDQ', 'Bavaro / Punta Cana', '0739d0f4-8077-4918-846b-f6d62acc5e18', 190, 'Zone A', true, 1),
  ('SDQ-BavaroPuntaCana-Minivan', 'zone_to_zone', 'SDQ', 'Bavaro / Punta Cana', 'd3bb2d95-beba-437d-a204-c628b80e0171', 230, 'Zone A', true, 1),
  ('SDQ-BavaroPuntaCana-Suburban', 'zone_to_zone', 'SDQ', 'Bavaro / Punta Cana', 'cf567eae-5335-44ad-96f2-12d25b37c5c1', 300, 'Zone A', true, 1),
  ('SDQ-BavaroPuntaCana-Sprinter', 'zone_to_zone', 'SDQ', 'Bavaro / Punta Cana', 'a431b998-0fec-4dd8-b576-579ae84f456a', 380, 'Zone A', true, 1),
  ('SDQ-BavaroPuntaCana-MiniBus', 'zone_to_zone', 'SDQ', 'Bavaro / Punta Cana', '86fde54a-6260-41e6-b1ab-95b99af44a3d', 520, 'Zone A', true, 1);

-- SDQ → Cap Cana (Zone B)
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, vehicle_type_id, base_price, zone, is_active, priority)
VALUES
  ('SDQ-CapCana-Sedan', 'zone_to_zone', 'SDQ', 'Cap Cana', '0739d0f4-8077-4918-846b-f6d62acc5e18', 200, 'Zone B', true, 1),
  ('SDQ-CapCana-Minivan', 'zone_to_zone', 'SDQ', 'Cap Cana', 'd3bb2d95-beba-437d-a204-c628b80e0171', 250, 'Zone B', true, 1),
  ('SDQ-CapCana-Suburban', 'zone_to_zone', 'SDQ', 'Cap Cana', 'cf567eae-5335-44ad-96f2-12d25b37c5c1', 320, 'Zone B', true, 1),
  ('SDQ-CapCana-Sprinter', 'zone_to_zone', 'SDQ', 'Cap Cana', 'a431b998-0fec-4dd8-b576-579ae84f456a', 400, 'Zone B', true, 1),
  ('SDQ-CapCana-MiniBus', 'zone_to_zone', 'SDQ', 'Cap Cana', '86fde54a-6260-41e6-b1ab-95b99af44a3d', 550, 'Zone B', true, 1);

-- SDQ → Uvero Alto (Zone C)
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, vehicle_type_id, base_price, zone, is_active, priority)
VALUES
  ('SDQ-UveroAlto-Sedan', 'zone_to_zone', 'SDQ', 'Uvero Alto', '0739d0f4-8077-4918-846b-f6d62acc5e18', 220, 'Zone C', true, 1),
  ('SDQ-UveroAlto-Minivan', 'zone_to_zone', 'SDQ', 'Uvero Alto', 'd3bb2d95-beba-437d-a204-c628b80e0171', 270, 'Zone C', true, 1),
  ('SDQ-UveroAlto-Suburban', 'zone_to_zone', 'SDQ', 'Uvero Alto', 'cf567eae-5335-44ad-96f2-12d25b37c5c1', 350, 'Zone C', true, 1),
  ('SDQ-UveroAlto-Sprinter', 'zone_to_zone', 'SDQ', 'Uvero Alto', 'a431b998-0fec-4dd8-b576-579ae84f456a', 420, 'Zone C', true, 1),
  ('SDQ-UveroAlto-MiniBus', 'zone_to_zone', 'SDQ', 'Uvero Alto', '86fde54a-6260-41e6-b1ab-95b99af44a3d', 580, 'Zone C', true, 1);

-- SDQ → Bayahibe (Zone D)
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, vehicle_type_id, base_price, zone, is_active, priority)
VALUES
  ('SDQ-Bayahibe-Sedan', 'zone_to_zone', 'SDQ', 'Bayahibe', '0739d0f4-8077-4918-846b-f6d62acc5e18', 240, 'Zone D', true, 1),
  ('SDQ-Bayahibe-Minivan', 'zone_to_zone', 'SDQ', 'Bayahibe', 'd3bb2d95-beba-437d-a204-c628b80e0171', 290, 'Zone D', true, 1),
  ('SDQ-Bayahibe-Suburban', 'zone_to_zone', 'SDQ', 'Bayahibe', 'cf567eae-5335-44ad-96f2-12d25b37c5c1', 380, 'Zone D', true, 1),
  ('SDQ-Bayahibe-Sprinter', 'zone_to_zone', 'SDQ', 'Bayahibe', 'a431b998-0fec-4dd8-b576-579ae84f456a', 450, 'Zone D', true, 1),
  ('SDQ-Bayahibe-MiniBus', 'zone_to_zone', 'SDQ', 'Bayahibe', '86fde54a-6260-41e6-b1ab-95b99af44a3d', 620, 'Zone D', true, 1);

-- PUJ ↔ SDQ Direct Route
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, vehicle_type_id, base_price, zone, is_active, priority)
VALUES
  ('PUJ-SDQ-Sedan', 'zone_to_zone', 'PUJ', 'SDQ', '0739d0f4-8077-4918-846b-f6d62acc5e18', 220, 'Direct', true, 1),
  ('PUJ-SDQ-Minivan', 'zone_to_zone', 'PUJ', 'SDQ', 'd3bb2d95-beba-437d-a204-c628b80e0171', 260, 'Direct', true, 1),
  ('PUJ-SDQ-Suburban', 'zone_to_zone', 'PUJ', 'SDQ', 'cf567eae-5335-44ad-96f2-12d25b37c5c1', 320, 'Direct', true, 1),
  ('PUJ-SDQ-Sprinter', 'zone_to_zone', 'PUJ', 'SDQ', 'a431b998-0fec-4dd8-b576-579ae84f456a', 420, 'Direct', true, 1),
  ('PUJ-SDQ-MiniBus', 'zone_to_zone', 'PUJ', 'SDQ', '86fde54a-6260-41e6-b1ab-95b99af44a3d', 600, 'Direct', true, 1);

-- SDQ → PUJ (reverse direction)
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, vehicle_type_id, base_price, zone, is_active, priority)
VALUES
  ('SDQ-PUJ-Sedan', 'zone_to_zone', 'SDQ', 'PUJ', '0739d0f4-8077-4918-846b-f6d62acc5e18', 220, 'Direct', true, 1),
  ('SDQ-PUJ-Minivan', 'zone_to_zone', 'SDQ', 'PUJ', 'd3bb2d95-beba-437d-a204-c628b80e0171', 260, 'Direct', true, 1),
  ('SDQ-PUJ-Suburban', 'zone_to_zone', 'SDQ', 'PUJ', 'cf567eae-5335-44ad-96f2-12d25b37c5c1', 320, 'Direct', true, 1),
  ('SDQ-PUJ-Sprinter', 'zone_to_zone', 'SDQ', 'PUJ', 'a431b998-0fec-4dd8-b576-579ae84f456a', 420, 'Direct', true, 1),
  ('SDQ-PUJ-MiniBus', 'zone_to_zone', 'SDQ', 'PUJ', '86fde54a-6260-41e6-b1ab-95b99af44a3d', 600, 'Direct', true, 1);