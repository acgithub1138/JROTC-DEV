
-- Drop the existing CRON job with incorrect body
SELECT cron.unschedule('unified-email-processor-1min');

-- Recreate with correct body parameter
SELECT cron.schedule(
  'unified-email-processor-1min',
  '* * * * *',
  $$SELECT net.http_post(
    url:='https://kdksbhapzsknieizubvu.supabase.co/functions/v1/email-queue-webhook',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtka3NiaGFwenNrbmllaXp1YnZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDc2ODQwMywiZXhwIjoyMDgwMzQ0NDAzfQ.LdC9FF0rfkx1raqFOSyGbiPvcCnhrctMKSMGdUjrQgY"}'::jsonb,
    body:='{"scheduled": true}'::jsonb
  ) as request_id;$$
);
