
-- Create all 9 CRON jobs

-- 1. Clear stale email locks - every 5 minutes
SELECT cron.schedule(
  'clear-stale-email-locks',
  '*/5 * * * *',
  $$SELECT clear_stale_email_processing_locks();$$
);

-- 2. Email queue health check - every 15 minutes
SELECT cron.schedule(
  'email-queue-health-check',
  '*/15 * * * *',
  $$SELECT check_email_queue_health();$$
);

-- 3. Queue delayed comp registration emails - every minute
SELECT cron.schedule(
  'queue_delayed_comp_registration_email_job',
  '* * * * *',
  $$SELECT queue_delayed_comp_registration_email();$$
);

-- 4. Process overdue task reminders - daily at 10 AM (with service role)
SELECT cron.schedule(
  'process-overdue-task-reminders',
  '0 10 * * *',
  $$SELECT net.http_post(
    url:='https://kdksbhapzsknieizubvu.supabase.co/functions/v1/process-overdue-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtka3NiaGFwenNrbmllaXp1YnZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDc2ODQwMywiZXhwIjoyMDgwMzQ0NDAzfQ.LdC9FF0rfkx1raqFOSyGbiPvcCnhrctMKSMGdUjrQgY"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;$$
);

-- 5. Unified email processor - every minute (with service role)
SELECT cron.schedule(
  'unified-email-processor-1min',
  '* * * * *',
  $$SELECT net.http_post(
    url:='https://kdksbhapzsknieizubvu.supabase.co/functions/v1/email-queue-webhook',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtka3NiaGFwenNrbmllaXp1YnZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDc2ODQwMywiZXhwIjoyMDgwMzQ0NDAzfQ.LdC9FF0rfkx1raqFOSyGbiPvcCnhrctMKSMGdUjrQgY"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;$$
);

-- 6. Deactivate expired announcements - daily at 8 AM (with anon key)
SELECT cron.schedule(
  'deactivate-expired-announcements-8am',
  '0 8 * * *',
  $$SELECT net.http_post(
    url:='https://kdksbhapzsknieizubvu.supabase.co/functions/v1/deactivate-expired-announcements',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtka3NiaGFwenNrbmllaXp1YnZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Njg0MDMsImV4cCI6MjA4MDM0NDQwM30.QN0--lMb7gZHpAS-ukaY64x5qJ2vChH4qFBzz5Eg7YA"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;$$
);

-- 7. Annual cadet update - August 1st at 6 AM (with anon key)
SELECT cron.schedule(
  'annual-cadet-update',
  '0 6 1 8 *',
  $$SELECT net.http_post(
    url:='https://kdksbhapzsknieizubvu.supabase.co/functions/v1/annual-cadet-update',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtka3NiaGFwenNrbmllaXp1YnZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Njg0MDMsImV4cCI6MjA4MDM0NDQwM30.QN0--lMb7gZHpAS-ukaY64x5qJ2vChH4qFBzz5Eg7YA"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;$$
);

-- 8. Update competition status (registration deadline) - daily at 11:30 PM (with anon key)
SELECT cron.schedule(
  'update-competition-status-registration-deadline',
  '30 23 * * *',
  $$SELECT net.http_post(
    url:='https://kdksbhapzsknieizubvu.supabase.co/functions/v1/update-competition-statuses',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtka3NiaGFwenNrbmllaXp1YnZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Njg0MDMsImV4cCI6MjA4MDM0NDQwM30.QN0--lMb7gZHpAS-ukaY64x5qJ2vChH4qFBzz5Eg7YA"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;$$
);

-- 9. Update competition status (start date) - daily at 5 AM (with anon key)
SELECT cron.schedule(
  'update-competition-status-start-date',
  '0 5 * * *',
  $$SELECT net.http_post(
    url:='https://kdksbhapzsknieizubvu.supabase.co/functions/v1/update-competition-statuses',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtka3NiaGFwenNrbmllaXp1YnZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Njg0MDMsImV4cCI6MjA4MDM0NDQwM30.QN0--lMb7gZHpAS-ukaY64x5qJ2vChH4qFBzz5Eg7YA"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;$$
);

-- Unschedule the health check job (to match original disabled state)
SELECT cron.unschedule('email-queue-health-check');
