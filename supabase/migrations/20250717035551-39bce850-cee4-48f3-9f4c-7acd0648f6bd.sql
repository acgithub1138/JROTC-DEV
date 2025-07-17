-- Remove automatic email processing triggers to prevent race conditions
DROP TRIGGER IF EXISTS email_rules_trigger ON public.tasks;
DROP TRIGGER IF EXISTS email_rules_trigger ON public.subtasks;
DROP TRIGGER IF EXISTS email_rules_trigger ON public.incidents;
DROP TRIGGER IF EXISTS trigger_email_webhook_trigger ON public.email_queue;

-- Remove existing cron jobs that cause multiple processors
SELECT cron.unschedule('process-email-queue-auto');
SELECT cron.unschedule('email-backup-retry-processor');

-- Create a single unified email processor scheduled job
SELECT cron.schedule(
  'unified-email-processor',
  '*/30 * * * * *', -- Every 30 seconds
  $$
  SELECT
    net.http_post(
        url:='https://vpiwfabbzaebfkadmmgd.supabase.co/functions/v1/email-queue-webhook',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaXdmYWJiemFlYmZrYWRtbWdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDcxMDIyOSwiZXhwIjoyMDY2Mjg2MjI5fQ.MdcIjFOevGAZXlPf5q6-XBqB2aVBdJyDwjNhA77YyGg"}'::jsonb,
        body:='{"scheduled": true, "process_all": true}'::jsonb,
        timeout_milliseconds := 60000
    ) as request_id;
  $$
);

-- Create email processing lock table for atomic operations
CREATE TABLE IF NOT EXISTS public.email_processing_lock (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by TEXT,
  last_processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial lock record
INSERT INTO public.email_processing_lock (id, is_locked) 
VALUES (1, FALSE) 
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for the lock table
ALTER TABLE public.email_processing_lock ENABLE ROW LEVEL SECURITY;

-- Create policy for system access to lock table
CREATE POLICY "System can manage email processing lock" 
ON public.email_processing_lock 
FOR ALL 
USING (TRUE)
WITH CHECK (TRUE);