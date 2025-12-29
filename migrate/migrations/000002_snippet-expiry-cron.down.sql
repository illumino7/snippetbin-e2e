SELECT cron.unschedule('cleanup-expired-snippets');

DROP EXTENSION pg_cron;