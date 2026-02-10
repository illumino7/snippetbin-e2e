-- Unschedule the cleanup job
SELECT cron.unschedule('cleanup-expired-snippets');

-- Drop pg_cron extension
DROP EXTENSION IF EXISTS pg_cron;
