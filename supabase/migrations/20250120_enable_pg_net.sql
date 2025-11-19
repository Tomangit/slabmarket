-- Enable pg_net extension for HTTP requests from SQL
-- This allows using net.http_post() in cron jobs to call Edge Functions

-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Enable pg_cron extension for scheduling cron jobs
-- This allows using cron.schedule() to schedule automated tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

