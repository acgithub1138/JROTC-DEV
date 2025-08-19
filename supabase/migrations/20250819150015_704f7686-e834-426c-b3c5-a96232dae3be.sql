-- Create CRON job to process email queue using Supabase email system
select
  cron.schedule(
    'process-email-queue-supabase',
    '* * * * *', -- every minute
    $$
    select
      net.http_post(
          url:='https://vpiwfabbzaebfkadmmgd.supabase.co/functions/v1/process-email-queue',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaXdmYWJiemFlYmZrYWRtbWdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDcxMDIyOSwiZXhwIjoyMDY2Mjg2MjI5fQ.4_bHGbcA1RHEq4QJ8RBHOmJJY0dBjU2COk_UQEr-eRE"}'::jsonb,
          body:='{"scheduled": true}'::jsonb
      ) as request_id;
    $$
  );