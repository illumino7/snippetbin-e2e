CREATE EXTENSION pg_cron;

-- Schedule the cleanup for the top of every hour
SELECT cron.schedule('cleanup-expired-snippets', '0 * * * *', $$
    DELETE FROM snippets WHERE expires_at < NOW()
$$);