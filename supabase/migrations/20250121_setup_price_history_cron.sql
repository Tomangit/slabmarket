-- Setup cron job for update-price-history Edge Function
-- This will automatically update price history daily at midnight UTC

-- First, ensure pg_net and pg_cron extensions are enabled
-- (They should already be enabled by migration 20250120_enable_pg_net.sql)
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing cron job if it exists (to allow re-running this migration)
SELECT cron.unschedule('update-price-history') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'update-price-history'
);

-- Schedule the cron job to run daily at midnight UTC
-- This will update price history for all active slabs
SELECT cron.schedule(
  'update-price-history',              -- Job name
  '0 0 * * *',                         -- Schedule: Daily at midnight UTC
  $$                                   -- SQL command (dollar-quoted string)
  SELECT
    net.http_post(
      url := current_setting('app.supabase_url', true) || '/functions/v1/update-price-history',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', current_setting('app.cron_secret', true)
      )
    ) AS request_id;
  $$
);

-- Alternative: If you prefer to use environment variable directly in SQL:
-- Note: Replace 'YOUR_PROJECT_URL' and 'YOUR_CRON_SECRET' with actual values
-- SELECT cron.schedule(
--   'update-price-history',
--   '0 0 * * *', -- Daily at midnight UTC
--   $$
--   SELECT
--     net.http_post(
--       url := 'https://icuumgfjnjynbyqvzxwb.supabase.co/functions/v1/update-price-history',
--       headers := '{"Content-Type": "application/json", "x-cron-secret": "YOUR_CRON_SECRET"}'::jsonb
--     ) AS request_id;
--   $$
-- );

-- Add comment
COMMENT ON EXTENSION pg_cron IS 'Enables scheduled tasks (cron jobs) for database operations';

-- Verify the cron job was created
DO $$
DECLARE
  job_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO job_count
  FROM cron.job
  WHERE jobname = 'update-price-history';
  
  IF job_count = 0 THEN
    RAISE WARNING 'Cron job "update-price-history" was not created. Please check the SQL and ensure pg_net and pg_cron extensions are enabled.';
  ELSE
    RAISE NOTICE 'Cron job "update-price-history" created successfully!';
  END IF;
END $$;

