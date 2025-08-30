-- Schedule annual cadet update to run on August 1st at 6:00 AM
SELECT cron.schedule(
  'annual-cadet-update',
  '0 6 1 8 *', -- Run at 6:00 AM on August 1st every year
  $$
  SELECT
    net.http_post(
        url:='https://vpiwfabbzaebfkadmmgd.supabase.co/functions/v1/annual-cadet-update',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaXdmYWJiemFlYmZrYWRtbWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTAyMjksImV4cCI6MjA2NjI4NjIyOX0.xkYDkckgoKTvAoyg8-IWMyMNGJs3ae5Uo1NrrHp7ygw"}'::jsonb,
        body:=concat('{"triggered_at": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);