-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a logging table for webhook trigger debugging
CREATE TABLE IF NOT EXISTS public.webhook_trigger_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL,
  trigger_fired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL,
  error_message TEXT,
  request_id UUID,
  response_status INTEGER
);

-- Enable RLS on the log table
ALTER TABLE public.webhook_trigger_log ENABLE ROW LEVEL SECURITY;

-- Create policy for system to insert logs
CREATE POLICY "System can insert webhook trigger logs" 
ON public.webhook_trigger_log 
FOR INSERT 
WITH CHECK (true);

-- Create policy for admins to view logs
CREATE POLICY "Admins can view webhook trigger logs" 
ON public.webhook_trigger_log 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- Update the trigger function with proper error handling and logging
CREATE OR REPLACE FUNCTION public.trigger_email_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  webhook_result UUID;
  webhook_error TEXT;
BEGIN
  -- Only trigger for pending emails
  IF NEW.status = 'pending' THEN
    BEGIN
      -- Log that we're attempting the webhook
      INSERT INTO public.webhook_trigger_log (email_id, status) 
      VALUES (NEW.id, 'attempting');
      
      -- Call the webhook edge function
      SELECT request_id INTO webhook_result 
      FROM net.http_post(
        url := 'https://vpiwfabbzaebfkadmmgd.supabase.co/functions/v1/email-queue-webhook',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaXdmYWJiemFlYmZrYWRtbWdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDcxMDIyOSwiZXhwIjoyMDY2Mjg2MjI5fQ.MdcIjFOevGAZXlPf5q6-XBqB2aVBdJyDwjNhA77YyGg"}'::jsonb,
        body := json_build_object('email_id', NEW.id)::jsonb
      );
      
      -- Log successful webhook trigger
      INSERT INTO public.webhook_trigger_log (email_id, status, request_id) 
      VALUES (NEW.id, 'success', webhook_result);
      
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