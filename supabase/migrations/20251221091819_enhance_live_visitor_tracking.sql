/*
  # Enhance Live Visitor Tracking
  
  1. Updates
    - Add missing columns to existing tables
    - Add indexes for performance
    - Create views for analytics
  
  2. Security
    - Tables already have RLS enabled
    - No changes to policies needed
*/

-- Add missing columns to page_views
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'page_views' AND column_name = 'device_id') THEN
    ALTER TABLE page_views ADD COLUMN device_id text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'page_views' AND column_name = 'page_path') THEN
    ALTER TABLE page_views ADD COLUMN page_path text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'page_views' AND column_name = 'is_landing_page') THEN
    ALTER TABLE page_views ADD COLUMN is_landing_page boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'page_views' AND column_name = 'gclid') THEN
    ALTER TABLE page_views ADD COLUMN gclid text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'page_views' AND column_name = 'user_agent') THEN
    ALTER TABLE page_views ADD COLUMN user_agent text;
  END IF;
END $$;

-- Add missing columns to active_sessions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'active_sessions' AND column_name = 'utm_term') THEN
    ALTER TABLE active_sessions ADD COLUMN utm_term text;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_views_device_id ON page_views(device_id);
CREATE INDEX IF NOT EXISTS idx_page_views_gclid ON page_views(gclid) WHERE gclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_page_views_is_landing ON page_views(is_landing_page) WHERE is_landing_page = true;
CREATE INDEX IF NOT EXISTS idx_active_sessions_gclid ON active_sessions(gclid) WHERE gclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_active_sessions_utm_campaign ON active_sessions(utm_campaign) WHERE utm_campaign IS NOT NULL;

-- View for live visitor statistics
CREATE OR REPLACE VIEW live_visitor_stats AS
SELECT 
  COUNT(DISTINCT session_id) as active_visitors,
  COUNT(DISTINCT CASE WHEN gclid IS NOT NULL THEN session_id END) as google_ads_visitors,
  COUNT(DISTINCT CASE WHEN utm_source IS NOT NULL THEN session_id END) as campaign_visitors,
  COUNT(*) as total_sessions,
  AVG(page_views_count) as avg_pages_per_session
FROM active_sessions
WHERE last_active_at >= NOW() - INTERVAL '5 minutes';

-- View for top pages in last hour
CREATE OR REPLACE VIEW top_pages_last_hour AS
SELECT 
  page_url,
  page_title,
  COUNT(*) as view_count,
  COUNT(DISTINCT session_id) as unique_visitors,
  COUNT(DISTINCT CASE WHEN gclid IS NOT NULL THEN session_id END) as google_ads_visitors
FROM page_views
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY page_url, page_title
ORDER BY view_count DESC
LIMIT 10;

-- View for traffic sources today
CREATE OR REPLACE VIEW traffic_sources_today AS
SELECT 
  COALESCE(utm_source, 'Direct') as source,
  COALESCE(utm_campaign, 'None') as campaign,
  COALESCE(utm_term, 'None') as keyword,
  COUNT(DISTINCT session_id) as unique_visitors,
  COUNT(*) as total_page_views,
  COUNT(DISTINCT CASE WHEN is_landing_page = true THEN session_id END) as new_sessions
FROM page_views
WHERE created_at >= CURRENT_DATE
GROUP BY utm_source, utm_campaign, utm_term
ORDER BY unique_visitors DESC;

-- View for visitor journey analysis
CREATE OR REPLACE VIEW visitor_journey_realtime AS
SELECT 
  a.session_id,
  a.landing_page,
  a.current_page_url,
  a.utm_source,
  a.utm_campaign,
  a.utm_term,
  a.gclid,
  a.page_views_count,
  a.started_at,
  a.last_active_at,
  EXTRACT(EPOCH FROM (a.last_active_at - a.started_at)) / 60 as session_duration_minutes,
  (SELECT COUNT(*) FROM conversion_events ce WHERE ce.session_id = a.session_id) as conversions
FROM active_sessions a
WHERE a.last_active_at >= NOW() - INTERVAL '5 minutes'
ORDER BY a.last_active_at DESC;
