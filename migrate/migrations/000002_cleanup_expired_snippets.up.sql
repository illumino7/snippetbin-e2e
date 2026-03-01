-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup job to run every 5 minutes to delete expired snippets
SELECT cron.schedule(
    'cleanup-expired-snippets',
    '*/5 * * * *',
    'DELETE FROM snippets WHERE expires_at < NOW()'
);
