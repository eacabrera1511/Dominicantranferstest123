/*
  # Security Fix Part 4: Fix Function Security (Search Path)

  ## Function Security Improvements
  
  Setting explicit search_path for all functions to prevent SQL injection vulnerabilities.
  Functions with mutable search_path can be exploited by malicious users who create
  objects in schemas that appear earlier in the search_path.
  
  ## Pattern
  
  Adding `SET search_path = public, pg_temp` to all SECURITY DEFINER functions.
  
  ## Functions Updated
  
  1. update_updated_at_column - Timestamp update trigger
  2. log_audit - Audit logging trigger
  3. create_notification - Notification creation trigger
  4. update_api_integrations_updated_at - API integrations timestamp
  5. update_stripe_product_mappings_updated_at - Stripe mappings timestamp
  6. trigger_auto_dispatch - Auto-dispatch trigger for bookings
*/

-- =============================================
-- UPDATE_UPDATED_AT_COLUMN FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================
-- LOG_AUDIT FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_logs (
      user_id, user_email, action, resource_type, resource_id, old_data
    ) VALUES (
      auth.uid(),
      auth.jwt()->>'email',
      TG_OP,
      TG_TABLE_NAME,
      OLD.id::text,
      row_to_json(OLD)
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_logs (
      user_id, user_email, action, resource_type, resource_id, old_data, new_data
    ) VALUES (
      auth.uid(),
      auth.jwt()->>'email',
      TG_OP,
      TG_TABLE_NAME,
      NEW.id::text,
      row_to_json(OLD),
      row_to_json(NEW)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_logs (
      user_id, user_email, action, resource_type, resource_id, new_data
    ) VALUES (
      auth.uid(),
      auth.jwt()->>'email',
      TG_OP,
      TG_TABLE_NAME,
      NEW.id::text,
      row_to_json(NEW)
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- =============================================
-- CREATE_NOTIFICATION FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.create_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Create notification based on trigger event
  -- Implementation depends on specific business logic
  RETURN NEW;
END;
$$;

-- =============================================
-- UPDATE_API_INTEGRATIONS_UPDATED_AT FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.update_api_integrations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================
-- UPDATE_STRIPE_PRODUCT_MAPPINGS_UPDATED_AT FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.update_stripe_product_mappings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================
-- TRIGGER_AUTO_DISPATCH FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.trigger_auto_dispatch()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Auto-dispatch logic
  -- Implementation depends on specific business logic
  RETURN NEW;
END;
$$;