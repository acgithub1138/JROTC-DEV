-- Schedule cron job to deactivate expired announcements at 8am daily
SELECT cron.schedule(
  'deactivate-expired-announcements-8am',
  '0 8 * * *', -- At 8:00 AM every day
  $$
  SELECT
    net.http_post(
        url:='https://vpiwfabbzaebfkadmmgd.supabase.co/functions/v1/deactivate-expired-announcements',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaXdmYWJiemFlYmZrYWRtbWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTAyMjksImV4cCI6MjA2NjI4NjIyOX0.xkYDkckgoKTvAoyg8-IWMyMNGJs3ae5Uo1NrrHp7ygw"}'::jsonb,
        body:=concat('{"triggered_at": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);