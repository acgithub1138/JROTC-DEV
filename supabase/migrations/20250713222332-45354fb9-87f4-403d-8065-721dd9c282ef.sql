-- Remove the existing cron job
SELECT cron.unschedule('process-email-queue-auto');

-- Create a new edge function trigger for email queue
CREATE OR REPLACE FUNCTION public.trigger_email_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Only trigger for pending emails
  IF NEW.status = 'pending' THEN
    -- Call the webhook edge function
    SELECT net.http_post(
      url := 'https://vpiwfabbzaebfkadmmgd.supabase.co/functions/v1/email-queue-webhook',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaXdmYWJiemFlYmZrYWRtbWdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDcxMDIyOSwiZXhwIjoyMDY2Mjg2MjI5fQ.MdcIjFOevGAZXlPf5q6-XBqB2aVBdJyDwjNhA77YyGg"}'::jsonb,
      body := json_build_object('email_id', NEW.id)::jsonb
    ) as request_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on email_queue table
DROP TRIGGER IF EXISTS email_queue_webhook_trigger ON public.email_queue;
CREATE TRIGGER email_queue_webhook_trigger
  AFTER INSERT OR UPDATE ON public.email_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_email_webhook();