/*
  # Security Fix Part 2: Optimize RLS Policy Performance (v2)

  ## RLS Policy Optimization
  
  Wrapping auth function calls with SELECT to prevent re-evaluation for each row.
  This improves query performance at scale by caching the auth context per query instead of per row.
  
  Pattern change: `auth.uid()` → `(select auth.uid())`
  Pattern change: `auth.jwt()` → `(select auth.jwt())`
  
  Fixed type casting issues in agent_users policy.
*/

-- =============================================
-- CUSTOMERS TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can manage all customers" ON public.customers;
DROP POLICY IF EXISTS "Agents can view customers" ON public.customers;

CREATE POLICY "Admins can manage all customers"
  ON public.customers
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Agents can view customers"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') IN ('admin', 'agent'));

-- =============================================
-- CORPORATE_ACCOUNTS TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can manage corporate accounts" ON public.corporate_accounts;
DROP POLICY IF EXISTS "Agents can view corporate accounts" ON public.corporate_accounts;

CREATE POLICY "Admins can manage corporate accounts"
  ON public.corporate_accounts
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Agents can view corporate accounts"
  ON public.corporate_accounts
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') IN ('admin', 'agent'));

-- =============================================
-- CUSTOMER_ADDRESSES TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can manage customer addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Agents can view customer addresses" ON public.customer_addresses;

CREATE POLICY "Admins can manage customer addresses"
  ON public.customer_addresses
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Agents can view customer addresses"
  ON public.customer_addresses
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') IN ('admin', 'agent'));

-- =============================================
-- CUSTOMER_PREFERENCES TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can manage customer preferences" ON public.customer_preferences;
DROP POLICY IF EXISTS "Agents can view customer preferences" ON public.customer_preferences;

CREATE POLICY "Admins can manage customer preferences"
  ON public.customer_preferences
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Agents can view customer preferences"
  ON public.customer_preferences
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') IN ('admin', 'agent'));

-- =============================================
-- VEHICLES TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can manage all vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Partners can manage their vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Agents can view all vehicles" ON public.vehicles;

CREATE POLICY "Admins can manage all vehicles"
  ON public.vehicles
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Partners can manage their vehicles"
  ON public.vehicles
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'partner' AND partner_id = (select auth.jwt()->>'partner_id')::uuid)
  WITH CHECK ((select auth.jwt()->>'role') = 'partner' AND partner_id = (select auth.jwt()->>'partner_id')::uuid);

CREATE POLICY "Agents can view all vehicles"
  ON public.vehicles
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') IN ('admin', 'agent'));

-- =============================================
-- DRIVERS TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can manage all drivers" ON public.drivers;
DROP POLICY IF EXISTS "Partners can manage their drivers" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can view own profile" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can update own location" ON public.drivers;

CREATE POLICY "Admins can manage all drivers"
  ON public.drivers
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Partners can manage their drivers"
  ON public.drivers
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'partner' AND partner_id = (select auth.jwt()->>'partner_id')::uuid)
  WITH CHECK ((select auth.jwt()->>'role') = 'partner' AND partner_id = (select auth.jwt()->>'partner_id')::uuid);

CREATE POLICY "Drivers can view own profile"
  ON public.drivers
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'driver' AND user_id = (select auth.uid()));

CREATE POLICY "Drivers can update own location"
  ON public.drivers
  FOR UPDATE
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'driver' AND user_id = (select auth.uid()))
  WITH CHECK ((select auth.jwt()->>'role') = 'driver' AND user_id = (select auth.uid()));

-- =============================================
-- DRIVER_AVAILABILITY TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can manage driver availability" ON public.driver_availability;
DROP POLICY IF EXISTS "Partners can manage their drivers availability" ON public.driver_availability;
DROP POLICY IF EXISTS "Agents can view driver availability" ON public.driver_availability;

CREATE POLICY "Admins can manage driver availability"
  ON public.driver_availability
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Partners can manage their drivers availability"
  ON public.driver_availability
  FOR ALL
  TO authenticated
  USING (
    (select auth.jwt()->>'role') = 'partner' 
    AND EXISTS (
      SELECT 1 FROM public.drivers 
      WHERE drivers.id = driver_availability.driver_id 
      AND drivers.partner_id = (select auth.jwt()->>'partner_id')::uuid
    )
  )
  WITH CHECK (
    (select auth.jwt()->>'role') = 'partner' 
    AND EXISTS (
      SELECT 1 FROM public.drivers 
      WHERE drivers.id = driver_availability.driver_id 
      AND drivers.partner_id = (select auth.jwt()->>'partner_id')::uuid
    )
  );

CREATE POLICY "Agents can view driver availability"
  ON public.driver_availability
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') IN ('admin', 'agent'));

-- =============================================
-- VEHICLE_MAINTENANCE_LOGS TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can manage maintenance logs" ON public.vehicle_maintenance_logs;
DROP POLICY IF EXISTS "Partners can manage their vehicle maintenance" ON public.vehicle_maintenance_logs;
DROP POLICY IF EXISTS "Agents can view maintenance logs" ON public.vehicle_maintenance_logs;

CREATE POLICY "Admins can manage maintenance logs"
  ON public.vehicle_maintenance_logs
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Partners can manage their vehicle maintenance"
  ON public.vehicle_maintenance_logs
  FOR ALL
  TO authenticated
  USING (
    (select auth.jwt()->>'role') = 'partner' 
    AND EXISTS (
      SELECT 1 FROM public.vehicles 
      WHERE vehicles.id = vehicle_maintenance_logs.vehicle_id 
      AND vehicles.partner_id = (select auth.jwt()->>'partner_id')::uuid
    )
  )
  WITH CHECK (
    (select auth.jwt()->>'role') = 'partner' 
    AND EXISTS (
      SELECT 1 FROM public.vehicles 
      WHERE vehicles.id = vehicle_maintenance_logs.vehicle_id 
      AND vehicles.partner_id = (select auth.jwt()->>'partner_id')::uuid
    )
  );

CREATE POLICY "Agents can view maintenance logs"
  ON public.vehicle_maintenance_logs
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') IN ('admin', 'agent'));

-- =============================================
-- PRICING_ZONES TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can manage pricing zones" ON public.pricing_zones;

CREATE POLICY "Admins can manage pricing zones"
  ON public.pricing_zones
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

-- =============================================
-- CORPORATE_RATE_CARDS TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can manage corporate rate cards" ON public.corporate_rate_cards;
DROP POLICY IF EXISTS "Agents can view corporate rate cards" ON public.corporate_rate_cards;

CREATE POLICY "Admins can manage corporate rate cards"
  ON public.corporate_rate_cards
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Agents can view corporate rate cards"
  ON public.corporate_rate_cards
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') IN ('admin', 'agent'));

-- =============================================
-- PRICE_QUOTES TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can manage all quotes" ON public.price_quotes;
DROP POLICY IF EXISTS "Agents can view and create quotes" ON public.price_quotes;
DROP POLICY IF EXISTS "Agents can insert quotes" ON public.price_quotes;

CREATE POLICY "Admins can manage all quotes"
  ON public.price_quotes
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Agents can view and create quotes"
  ON public.price_quotes
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') IN ('admin', 'agent'));

CREATE POLICY "Agents can insert quotes"
  ON public.price_quotes
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt()->>'role') IN ('admin', 'agent'));

-- =============================================
-- TRIP_ASSIGNMENTS TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can manage all assignments" ON public.trip_assignments;
DROP POLICY IF EXISTS "Agents can manage assignments" ON public.trip_assignments;
DROP POLICY IF EXISTS "Drivers can view own assignments" ON public.trip_assignments;
DROP POLICY IF EXISTS "Drivers can update own assignments" ON public.trip_assignments;

CREATE POLICY "Admins can manage all assignments"
  ON public.trip_assignments
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Agents can manage assignments"
  ON public.trip_assignments
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') IN ('admin', 'agent'))
  WITH CHECK ((select auth.jwt()->>'role') IN ('admin', 'agent'));

CREATE POLICY "Drivers can view own assignments"
  ON public.trip_assignments
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'driver' AND driver_id IN (
    SELECT id FROM public.drivers WHERE user_id = (select auth.uid())
  ));

CREATE POLICY "Drivers can update own assignments"
  ON public.trip_assignments
  FOR UPDATE
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'driver' AND driver_id IN (
    SELECT id FROM public.drivers WHERE user_id = (select auth.uid())
  ))
  WITH CHECK ((select auth.jwt()->>'role') = 'driver' AND driver_id IN (
    SELECT id FROM public.drivers WHERE user_id = (select auth.uid())
  ));

-- =============================================
-- TRIP_LOGS TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can view all trip logs" ON public.trip_logs;
DROP POLICY IF EXISTS "Agents can view trip logs" ON public.trip_logs;
DROP POLICY IF EXISTS "Drivers can create logs for own assignments" ON public.trip_logs;
DROP POLICY IF EXISTS "Drivers can view own trip logs" ON public.trip_logs;

CREATE POLICY "Admins can view all trip logs"
  ON public.trip_logs
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Agents can view trip logs"
  ON public.trip_logs
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') IN ('admin', 'agent'));

CREATE POLICY "Drivers can create logs for own assignments"
  ON public.trip_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.jwt()->>'role') = 'driver' 
    AND assignment_id IN (
      SELECT id FROM public.trip_assignments 
      WHERE driver_id IN (
        SELECT id FROM public.drivers WHERE user_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Drivers can view own trip logs"
  ON public.trip_logs
  FOR SELECT
  TO authenticated
  USING (
    (select auth.jwt()->>'role') = 'driver' 
    AND assignment_id IN (
      SELECT id FROM public.trip_assignments 
      WHERE driver_id IN (
        SELECT id FROM public.drivers WHERE user_id = (select auth.uid())
      )
    )
  );

-- =============================================
-- AGENT_USERS TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can manage agents" ON public.agent_users;
DROP POLICY IF EXISTS "Agents can view own profile" ON public.agent_users;

CREATE POLICY "Admins can manage agents"
  ON public.agent_users
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Agents can view own profile"
  ON public.agent_users
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'agent' AND id = (select auth.uid()));

-- =============================================
-- INVOICES TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can manage all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Agents can view and create invoices" ON public.invoices;
DROP POLICY IF EXISTS "Agents can insert invoices" ON public.invoices;

CREATE POLICY "Admins can manage all invoices"
  ON public.invoices
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Agents can view and create invoices"
  ON public.invoices
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') IN ('admin', 'agent'));

CREATE POLICY "Agents can insert invoices"
  ON public.invoices
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt()->>'role') IN ('admin', 'agent'));

-- =============================================
-- API_INTEGRATIONS TABLE
-- =============================================
DROP POLICY IF EXISTS "Admin can view API integrations" ON public.api_integrations;
DROP POLICY IF EXISTS "Admin can insert API integrations" ON public.api_integrations;
DROP POLICY IF EXISTS "Admin can update API integrations" ON public.api_integrations;

CREATE POLICY "Admin can view API integrations"
  ON public.api_integrations
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Admin can insert API integrations"
  ON public.api_integrations
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Admin can update API integrations"
  ON public.api_integrations
  FOR UPDATE
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

-- =============================================
-- DRIVER_NOTIFICATIONS TABLE
-- =============================================
DROP POLICY IF EXISTS "Drivers can view own notifications" ON public.driver_notifications;
DROP POLICY IF EXISTS "Drivers can mark own notifications as read" ON public.driver_notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.driver_notifications;

CREATE POLICY "Drivers can view own notifications"
  ON public.driver_notifications
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'driver' AND driver_id IN (
    SELECT id FROM public.drivers WHERE user_id = (select auth.uid())
  ));

CREATE POLICY "Drivers can mark own notifications as read"
  ON public.driver_notifications
  FOR UPDATE
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'driver' AND driver_id IN (
    SELECT id FROM public.drivers WHERE user_id = (select auth.uid())
  ))
  WITH CHECK ((select auth.jwt()->>'role') = 'driver' AND driver_id IN (
    SELECT id FROM public.drivers WHERE user_id = (select auth.uid())
  ));

CREATE POLICY "Admins can view all notifications"
  ON public.driver_notifications
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin');

-- =============================================
-- STRIPE_CUSTOMERS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view their own customer data" ON public.stripe_customers;

CREATE POLICY "Users can view their own customer data"
  ON public.stripe_customers
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =============================================
-- PAYMENT_TRANSACTIONS TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can manage payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Customers can view own transactions" ON public.payment_transactions;

CREATE POLICY "Admins can manage payment transactions"
  ON public.payment_transactions
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Customers can view own transactions"
  ON public.payment_transactions
  FOR SELECT
  TO authenticated
  USING (customer_id IN (
    SELECT id FROM public.customers WHERE email = (select auth.jwt()->>'email')
  ));

-- =============================================
-- REVIEW_REQUESTS TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can manage review requests" ON public.review_requests;
DROP POLICY IF EXISTS "Customers can view own review requests" ON public.review_requests;

CREATE POLICY "Admins can manage review requests"
  ON public.review_requests
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Customers can view own review requests"
  ON public.review_requests
  FOR SELECT
  TO authenticated
  USING (customer_id IN (
    SELECT id FROM public.customers WHERE email = (select auth.jwt()->>'email')
  ));

-- =============================================
-- ADMIN_NOTIFICATIONS TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Agents can view notifications" ON public.admin_notifications;

CREATE POLICY "Admins can manage notifications"
  ON public.admin_notifications
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Agents can view notifications"
  ON public.admin_notifications
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') IN ('admin', 'agent'));

-- =============================================
-- PARTNER_TRANSACTIONS TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can manage partner transactions" ON public.partner_transactions;
DROP POLICY IF EXISTS "Partners can view own transactions" ON public.partner_transactions;

CREATE POLICY "Admins can manage partner transactions"
  ON public.partner_transactions
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Partners can view own transactions"
  ON public.partner_transactions
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'partner' AND partner_id = (select auth.jwt()->>'partner_id')::uuid);

-- =============================================
-- PARTNER_PAYOUTS TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can manage payouts" ON public.partner_payouts;
DROP POLICY IF EXISTS "Partners can view own payouts" ON public.partner_payouts;

CREATE POLICY "Admins can manage payouts"
  ON public.partner_payouts
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Partners can view own payouts"
  ON public.partner_payouts
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'partner' AND partner_id = (select auth.jwt()->>'partner_id')::uuid);

-- =============================================
-- PARTNER_DAILY_STATS TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can view all partner stats" ON public.partner_daily_stats;
DROP POLICY IF EXISTS "Partners can view own stats" ON public.partner_daily_stats;

CREATE POLICY "Admins can view all partner stats"
  ON public.partner_daily_stats
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Partners can view own stats"
  ON public.partner_daily_stats
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'partner' AND partner_id = (select auth.jwt()->>'partner_id')::uuid);

-- =============================================
-- CUSTOMER_ACTIVITY_LOG TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.customer_activity_log;
DROP POLICY IF EXISTS "Customers can view own activity" ON public.customer_activity_log;

CREATE POLICY "Admins can view all activity logs"
  ON public.customer_activity_log
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin');

CREATE POLICY "Customers can view own activity"
  ON public.customer_activity_log
  FOR SELECT
  TO authenticated
  USING (customer_id IN (
    SELECT id FROM public.customers WHERE email = (select auth.jwt()->>'email')
  ));

-- =============================================
-- AUTOMATION_LOGS TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can view automation logs" ON public.automation_logs;

CREATE POLICY "Admins can view automation logs"
  ON public.automation_logs
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin');

-- =============================================
-- AUTOMATION_ERRORS TABLE
-- =============================================
DROP POLICY IF EXISTS "Admins can manage automation errors" ON public.automation_errors;

CREATE POLICY "Admins can manage automation errors"
  ON public.automation_errors
  FOR ALL
  TO authenticated
  USING ((select auth.jwt()->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->>'role') = 'admin');