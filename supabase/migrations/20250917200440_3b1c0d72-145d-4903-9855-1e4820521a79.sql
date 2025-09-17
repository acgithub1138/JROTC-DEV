-- 1) Disable immediate send in trigger by replacing function body (no-op)
CREATE OR REPLACE FUNCTION public.handle_comp_registration_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Deprecated: we now send registration emails via the delayed processor after ~30 seconds
  RAISE LOG 'handle_comp_registration_email skipped; using delayed processor';
  RETURN NEW;
END;
$function$;

-- 2) Ensure pg_cron is available and schedule the delayed processor
--    This will run every minute and the function itself enforces a 30s minimum age
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Unschedule existing job if present to avoid duplicates
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'queue_delayed_comp_registration_email_job'
  ) THEN
    PERFORM cron.unschedule('queue_delayed_comp_registration_email_job');
  END IF;
END$$;

-- Schedule to run every minute
SELECT cron.schedule(
  'queue_delayed_comp_registration_email_job',
  '* * * * *',
  $$
  SELECT public.queue_delayed_comp_registration_email();
  $$
);

-- Notes:
-- - Emails will now be sent by public.queue_delayed_comp_registration_email(),
--   which only processes registrations at least 30 seconds old.
-- - The immediate trigger remains but performs no action to avoid duplicate sends.
