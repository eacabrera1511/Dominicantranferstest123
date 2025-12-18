/*
  # Security Fix Part 3: Add Missing RLS Policies

  ## Add Policies for Tables with RLS Enabled but No Policies
  
  These tables have RLS enabled but no policies, making them completely inaccessible.
  Adding appropriate policies based on business logic:
  
  1. **audit_logs** - Read-only for admins
     - Admins can view all audit logs
  
  2. **booking_segments** - Managed by admins and agents
     - Admins can manage all segments
     - Agents can view segments
  
  3. **companies** - Managed by admins
     - Admins can manage companies
     - Agents can view companies
  
  4. **notifications** - User-specific with admin override
     - Users can view and update their own notifications
     - Admins can manage all notifications
     - System can create notifications
  
  5. **partner_commissions** - Admin and partner access
     - Admins can manage all commissions
     - Partners can view their own commissions
  
  6. **payments** - Admin, agent, and customer access
     - Admins can manage all payments
     - Agents can view payments
     - Customers can view their own payments
*/

-- =============================================
-- AUDIT_LOGS TABLE
-- =============================================

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin');

-- =============================================
-- BOOKING_SEGMENTS TABLE
-- =============================================

CREATE POLICY "Admins can manage booking segments"
  ON public.booking_segments
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Agents can view booking segments"
  ON public.booking_segments
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') IN ('admin', 'agent'));

-- =============================================
-- COMPANIES TABLE
-- =============================================

CREATE POLICY "Admins can manage companies"
  ON public.companies
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Agents can view companies"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') IN ('admin', 'agent'));

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================

CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (recipient_id::text = (select auth.uid())::text);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (recipient_id::text = (select auth.uid())::text)
  WITH CHECK (recipient_id::text = (select auth.uid())::text);

CREATE POLICY "Admins can manage all notifications"
  ON public.notifications
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "System can create notifications"
  ON public.notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- =============================================
-- PARTNER_COMMISSIONS TABLE
-- =============================================

CREATE POLICY "Admins can manage partner commissions"
  ON public.partner_commissions
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Partners can view own commissions"
  ON public.partner_commissions
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'partner' AND partner_id = (select auth.jwt()->>'partner_id')::uuid);

-- =============================================
-- PAYMENTS TABLE
-- =============================================

CREATE POLICY "Admins can manage payments"
  ON public.payments
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Agents can view payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') IN ('admin', 'agent'));

CREATE POLICY "Customers can view own payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (customer_id IN (
    SELECT id FROM public.customers WHERE email = (select auth.jwt()->>'email')
  ));