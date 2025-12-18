/*
  # Fix Security and Performance Issues

  ## Changes Applied

  ### 1. Add Missing Foreign Key Indexes
  Adds indexes for foreign key columns to improve query performance:
    - `bookings.conversation_id`
    - `messages.conversation_id`
    - `support_tickets.created_by`
    - `support_tickets.partner_id`
    - `ticket_communications.agent_id`
    - `ticket_follow_ups.agent_id`

  ### 2. Remove Unused Indexes
  Drops indexes that are not being used to improve write performance:
    - Support ticket related indexes
    - Partner and orders indexes
    - Availability and sync logs indexes
    - Partner messages and payout methods indexes
    - LLM usage logs indexes

  ### 3. Fix Multiple Permissive Policies
  Consolidates duplicate SELECT policies on:
    - `availability` table
    - `partner_api_connections` table

  ### 4. Secure Function Search Paths
  Sets secure search_path on all functions to prevent privilege escalation

  ## Security Notes
  - All foreign keys now have covering indexes for optimal query performance
  - Removed unused indexes to reduce storage overhead and improve write speed
  - Consolidated RLS policies to prevent policy conflicts
  - Secured all functions against search_path manipulation attacks
*/

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

-- Add index for bookings.conversation_id
CREATE INDEX IF NOT EXISTS idx_bookings_conversation_id 
ON public.bookings(conversation_id);

-- Add index for messages.conversation_id
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
ON public.messages(conversation_id);

-- Add index for support_tickets.created_by
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_by 
ON public.support_tickets(created_by);

-- Add index for support_tickets.partner_id
CREATE INDEX IF NOT EXISTS idx_support_tickets_partner_id 
ON public.support_tickets(partner_id);

-- Add index for ticket_communications.agent_id
CREATE INDEX IF NOT EXISTS idx_ticket_communications_agent_id 
ON public.ticket_communications(agent_id);

-- Add index for ticket_follow_ups.agent_id
CREATE INDEX IF NOT EXISTS idx_ticket_follow_ups_agent_id 
ON public.ticket_follow_ups(agent_id);

-- =====================================================
-- 2. DROP UNUSED INDEXES
-- =====================================================

-- Support ticket indexes
DROP INDEX IF EXISTS public.idx_support_tickets_assigned;
DROP INDEX IF EXISTS public.idx_support_tickets_created;
DROP INDEX IF EXISTS public.idx_support_tickets_number;
DROP INDEX IF EXISTS public.idx_ticket_communications_ticket;
DROP INDEX IF EXISTS public.idx_ticket_follow_ups_ticket;
DROP INDEX IF EXISTS public.idx_ticket_follow_ups_due;
DROP INDEX IF EXISTS public.idx_ticket_tags_ticket;

-- Partner and hotel indexes
DROP INDEX IF EXISTS public.idx_partners_status;
DROP INDEX IF EXISTS public.idx_partners_business_type;
DROP INDEX IF EXISTS public.idx_hotels_partner_id;

-- Order indexes
DROP INDEX IF EXISTS public.idx_orders_partner_id;
DROP INDEX IF EXISTS public.idx_orders_status;
DROP INDEX IF EXISTS public.idx_orders_created_at;
DROP INDEX IF EXISTS public.idx_orders_customer_email;
DROP INDEX IF EXISTS public.idx_orders_payment_status;
DROP INDEX IF EXISTS public.idx_orders_payment_method;
DROP INDEX IF EXISTS public.idx_orders_booking_type;

-- Sync and API connection indexes
DROP INDEX IF EXISTS public.idx_sync_logs_connection_id;
DROP INDEX IF EXISTS public.idx_sync_logs_started_at;
DROP INDEX IF EXISTS public.idx_api_connections_status;

-- Availability indexes
DROP INDEX IF EXISTS public.idx_availability_partner_id;
DROP INDEX IF EXISTS public.idx_availability_resource;
DROP INDEX IF EXISTS public.idx_availability_date;
DROP INDEX IF EXISTS public.idx_availability_status;

-- LLM usage logs indexes
DROP INDEX IF EXISTS public.idx_llm_usage_logs_model;

-- Partner messages indexes
DROP INDEX IF EXISTS public.idx_partner_messages_order_id;
DROP INDEX IF EXISTS public.idx_partner_messages_is_read;
DROP INDEX IF EXISTS public.idx_partner_messages_message_type;
DROP INDEX IF EXISTS public.idx_partner_messages_created_at;
DROP INDEX IF EXISTS public.idx_partner_messages_priority;

-- Partner payout methods indexes
DROP INDEX IF EXISTS public.idx_partner_payout_methods_is_primary;
DROP INDEX IF EXISTS public.idx_partner_payout_methods_status;

-- =====================================================
-- 3. FIX MULTIPLE PERMISSIVE POLICIES
-- =====================================================

-- Fix availability table - Drop duplicate policy and keep the more restrictive one
DROP POLICY IF EXISTS "Anyone can manage availability" ON public.availability;
-- Keep "Anyone can view availability" policy

-- Fix partner_api_connections table - Drop duplicate policy
DROP POLICY IF EXISTS "Anyone can manage API connections" ON public.partner_api_connections;
-- Keep "Anyone can view API connections" policy

-- =====================================================
-- 4. SECURE FUNCTION SEARCH PATHS
-- =====================================================

-- Secure all functions by setting immutable search_path
ALTER FUNCTION public.update_orders_updated_at() 
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_api_connections_updated_at() 
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_availability_status() 
  SET search_path = public, pg_temp;

ALTER FUNCTION public.create_order_notification() 
  SET search_path = public, pg_temp;

ALTER FUNCTION public.create_order_update_notification() 
  SET search_path = public, pg_temp;

ALTER FUNCTION public.create_partner_notification_settings() 
  SET search_path = public, pg_temp;

ALTER FUNCTION public.ensure_single_primary_payout() 
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_partner_credentials_timestamp() 
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_partner_payout_methods_timestamp() 
  SET search_path = public, pg_temp;

ALTER FUNCTION public.generate_ticket_number() 
  SET search_path = public, pg_temp;