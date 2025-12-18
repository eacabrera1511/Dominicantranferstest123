/*
  # Add Zone E (Santo Domingo City) Pricing

  This migration adds pricing rules for SDQ → Santo Domingo City hotels (Zone E).
  Zone E represents hotels within Santo Domingo city, requiring short local transfers from SDQ airport.

  ## New Pricing Rules

  ### SDQ → Santo Domingo (Zone E) - Local City Transfers
  - Sedan: $35 one-way ($67 roundtrip)
  - Minivan: $50 one-way ($95 roundtrip)
  - Suburban: $70 one-way ($133 roundtrip)
  - Sprinter: $100 one-way ($190 roundtrip)
  - Mini Bus: $150 one-way ($285 roundtrip)

  ## Zone E Hotels Include
  - JW Marriott Santo Domingo
  - Intercontinental Real
  - Barceló Santo Domingo
  - Sheraton Santo Domingo
  - El Embajador Royal Hideaway
  - Hodelpa Nicolas de Ovando
  - Billini Hotel
  - Aloft Santo Domingo

  ## Important Notes
  - These are local city transfers (15-30 min from SDQ)
  - Roundtrip pricing uses standard multiplier (1.9x)
  - All prices in USD
*/

-- SDQ → Santo Domingo (Zone E) - Local City Transfers
INSERT INTO pricing_rules (rule_name, rule_type, origin, destination, vehicle_type_id, base_price, zone, is_active, priority)
VALUES
  ('SDQ-SantoDomingo-Sedan', 'zone_to_zone', 'SDQ', 'Santo Domingo', '0739d0f4-8077-4918-846b-f6d62acc5e18', 35, 'Zone E', true, 1),
  ('SDQ-SantoDomingo-Minivan', 'zone_to_zone', 'SDQ', 'Santo Domingo', 'd3bb2d95-beba-437d-a204-c628b80e0171', 50, 'Zone E', true, 1),
  ('SDQ-SantoDomingo-Suburban', 'zone_to_zone', 'SDQ', 'Santo Domingo', 'cf567eae-5335-44ad-96f2-12d25b37c5c1', 70, 'Zone E', true, 1),
  ('SDQ-SantoDomingo-Sprinter', 'zone_to_zone', 'SDQ', 'Santo Domingo', 'a431b998-0fec-4dd8-b576-579ae84f456a', 100, 'Zone E', true, 1),
  ('SDQ-SantoDomingo-MiniBus', 'zone_to_zone', 'SDQ', 'Santo Domingo', '86fde54a-6260-41e6-b1ab-95b99af44a3d', 150, 'Zone E', true, 1);