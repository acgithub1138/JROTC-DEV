-- Create a cron job to run the overdue reminders processor daily at 10 AM UTC
-- This will automatically send reminder emails for tasks due in 3, 2, 1 days and on the due date

SELECT cron.schedule(
  'process-overdue-task-reminders',
  '0 10 * * *', -- Run at 10:00 AM UTC every day
  $$
  SELECT
    net.http_post(
        url:='https://vpiwfabbzaebfkadmmgd.supabase.co/functions/v1/process-overdue-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaXdmYWJiemFlYmZrYWRtbWdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDcxMDIyOSwiZXhwIjoyMDY2Mjg2MjI5fQ.MdcIjFOevGAZXlPf5q6-XBqB2aVBdJyDwjNhA77YyGg"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);