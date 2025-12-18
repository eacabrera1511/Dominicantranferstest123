/*
  # Security Fix Part 1: Add Missing Foreign Key Indexes

  ## Performance Improvements
  
  Adding indexes on foreign key columns to improve query performance and join operations:
  
  1. **availability** table
     - partner_id index for faster partner lookups
  
  2. **corporate_rate_cards** table
     - to_zone_id index for zone-based pricing queries
  
  3. **customers** table
     - company_id index for company-related queries
     - preferred_vehicle_type_id index for vehicle type preferences
  
  4. **hotels** table
     - partner_id index for partner hotel lookups
  
  5. **invoices** table
     - assignment_id index for assignment-invoice relationships
  
  6. **notifications** table
     - invoice_id index for invoice notifications
     - order_id index for order notifications
  
  7. **orders** table
     - partner_id index for partner order queries
  
  8. **partner_commissions** table
     - order_id index for commission calculations
  
  9. **partner_messages** table
     - order_id index for order-related messages
  
  10. **payments** table
      - order_id index for payment tracking
  
  11. **price_quotes** table
      - from_zone_id and to_zone_id indexes for route pricing
  
  12. **pricing_rules** table
      - to_zone_id index for destination-based pricing
  
  13. **review_requests** table
      - driver_id index for driver review lookups
  
  14. **support_tickets** table
      - assigned_to index for agent workload queries
  
  15. **sync_logs** table
      - connection_id index for integration monitoring
  
  16. **ticket_communications** table
      - ticket_id index for ticket history
  
  17. **ticket_follow_ups** table
      - ticket_id index for follow-up tracking

  These indexes will significantly improve query performance for foreign key joins and lookups.
*/

-- Add indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_availability_partner_id ON public.availability(partner_id);
CREATE INDEX IF NOT EXISTS idx_corporate_rate_cards_to_zone_id ON public.corporate_rate_cards(to_zone_id);
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_preferred_vehicle_type_id ON public.customers(preferred_vehicle_type_id);
CREATE INDEX IF NOT EXISTS idx_hotels_partner_id ON public.hotels(partner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_assignment_id ON public.invoices(assignment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_invoice_id ON public.notifications(invoice_id);
CREATE INDEX IF NOT EXISTS idx_notifications_order_id ON public.notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_partner_id ON public.orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_commissions_order_id ON public.partner_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_partner_messages_order_id ON public.partner_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_price_quotes_from_zone_id ON public.price_quotes(from_zone_id);
CREATE INDEX IF NOT EXISTS idx_price_quotes_to_zone_id ON public.price_quotes(to_zone_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_to_zone_id ON public.pricing_rules(to_zone_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_driver_id ON public.review_requests(driver_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_sync_logs_connection_id ON public.sync_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_ticket_communications_ticket_id ON public.ticket_communications(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_follow_ups_ticket_id ON public.ticket_follow_ups(ticket_id);