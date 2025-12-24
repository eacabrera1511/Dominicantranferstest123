/*
  # Add Hero Video Mobile Responsiveness Settings

  1. Changes to landing_page_settings
    - Add `hero_video_mobile_url` for mobile-specific video
    - Add `show_video_on_mobile` toggle
    - Add `mobile_video_autoplay` toggle
    - Add `desktop_video_autoplay` toggle
    - Add `video_muted` toggle
    - Add `video_loop` toggle
    - Add `video_playback_speed` for custom speed

  2. Purpose
    - Allow different videos for mobile and desktop
    - Control video behavior on different devices
    - Optimize mobile experience with smaller video files
    - Give admins full control over video display
*/

-- Add mobile video settings columns
DO $$
BEGIN
  -- Mobile video URL
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'landing_page_settings' AND column_name = 'hero_video_mobile_url'
  ) THEN
    ALTER TABLE landing_page_settings ADD COLUMN hero_video_mobile_url text;
  END IF;

  -- Show video on mobile toggle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'landing_page_settings' AND column_name = 'show_video_on_mobile'
  ) THEN
    ALTER TABLE landing_page_settings ADD COLUMN show_video_on_mobile boolean DEFAULT true;
  END IF;

  -- Mobile autoplay toggle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'landing_page_settings' AND column_name = 'mobile_video_autoplay'
  ) THEN
    ALTER TABLE landing_page_settings ADD COLUMN mobile_video_autoplay boolean DEFAULT true;
  END IF;

  -- Desktop autoplay toggle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'landing_page_settings' AND column_name = 'desktop_video_autoplay'
  ) THEN
    ALTER TABLE landing_page_settings ADD COLUMN desktop_video_autoplay boolean DEFAULT true;
  END IF;

  -- Video muted toggle (important for autoplay)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'landing_page_settings' AND column_name = 'video_muted'
  ) THEN
    ALTER TABLE landing_page_settings ADD COLUMN video_muted boolean DEFAULT true;
  END IF;

  -- Video loop toggle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'landing_page_settings' AND column_name = 'video_loop'
  ) THEN
    ALTER TABLE landing_page_settings ADD COLUMN video_loop boolean DEFAULT true;
  END IF;

  -- Video playback speed (0.5 to 2.0)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'landing_page_settings' AND column_name = 'video_playback_speed'
  ) THEN
    ALTER TABLE landing_page_settings ADD COLUMN video_playback_speed decimal(3,1) DEFAULT 1.0;
  END IF;
END $$;

-- Add check constraint for playback speed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'video_playback_speed_range'
  ) THEN
    ALTER TABLE landing_page_settings
    ADD CONSTRAINT video_playback_speed_range
    CHECK (video_playback_speed >= 0.5 AND video_playback_speed <= 2.0);
  END IF;
END $$;
