-- First, let's see what cron jobs exist
SELECT * FROM cron.job;

-- Remove any existing email processing cron jobs
SELECT cron.unschedule('email-queue-processor');
SELECT cron.unschedule('process-email-queue');

-- Create new cron job to call process-email-queue function every minute
SELECT cron.schedule(
  'process-email-queue-smtp',
  '* * * * *', -- every minute
  $$
  select
    net.http_post(
        url:='https://vpiwfabbzaebfkadmmgd.supabase.co/functions/v1/process-email-queue',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaXdmYWJiemFlYmZrYWRtbWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTAyMjksImV4cCI6MjA2NjI4NjIyOX0.xkYDkckgoKTvAoyg8-IWMyMNGJs3ae5Uo1NrrHp7ygw"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);