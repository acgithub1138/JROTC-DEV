-- Fix the trigger function to properly handle net.http_post return value
CREATE OR REPLACE FUNCTION public.trigger_email_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  webhook_result TEXT;
  webhook_error TEXT;
BEGIN
  -- Only trigger for pending emails
  IF NEW.status = 'pending' THEN
    BEGIN
      -- Log that we're attempting the webhook
      INSERT INTO public.webhook_trigger_log (email_id, status) 
      VALUES (NEW.id, 'attempting');
      
      -- Call the webhook edge function
      -- net.http_post returns a request ID as text/integer, not UUID
      SELECT net.http_post(
        url := 'https://vpiwfabbzaebfkadmmgd.supabase.co/functions/v1/email-queue-webhook',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaXdmYWJiemFlYmZrYWRtbWdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDcxMDIyOSwiZXhwIjoyMDY2Mjg2MjI5fQ.MdcIjFOevGAZXlPf5q6-XBqB2aVBdJyDwjNhA77YyGg"}'::jsonb,
        body := json_build_object('email_id', NEW.id)::jsonb
      )::text INTO webhook_result;
      
      -- Log successful webhook trigger
      INSERT INTO public.webhook_trigger_log (email_id, status, error_message) 
      VALUES (NEW.id, 'success', 'Request ID: ' || COALESCE(webhook_result, 'unknown'));
      
    EXCEPTION WHEN OTHERS THEN
      -- Capture the error
      webhook_error := SQLERRM;
      
      -- Log the error
      INSERT INTO public.webhook_trigger_log (email_id, status, error_message) 
      VALUES (NEW.id, 'error', webhook_error);
      
      -- Don't raise the error to avoid blocking the main operation
      -- Just log it and continue
      RAISE WARNING 'Webhook trigger failed for email %: %', NEW.id, webhook_error;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Also drop the request_id column since we're storing it in error_message field now
ALTER TABLE public.webhook_trigger_log DROP COLUMN IF EXISTS request_id;