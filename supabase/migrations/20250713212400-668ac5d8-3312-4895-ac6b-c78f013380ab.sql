-- Enable required extensions for cron jobs and HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to process email queue every 10 seconds
SELECT cron.schedule(
  'process-email-queue-auto',
  '*/10 * * * * *', -- Every 10 seconds
  $$
  SELECT
    net.http_post(
        url:='https://vpiwfabbzaebfkadmmgd.supabase.co/functions/v1/process-email-queue',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaXdmYWJiemFlYmZrYWRtbWdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDcxMDIyOSwiZXhwIjoyMDY2Mjg2MjI5fQ.MdcIjFOevGAZXlPf5q6-XBqB2aVBdJyDwjNhA77YyGg"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);

-- Create a simple log table to track email processing
CREATE TABLE IF NOT EXISTS public.email_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  request_id UUID,
  status TEXT DEFAULT 'pending'
);

-- Enable RLS on the log table
ALTER TABLE public.email_processing_log ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing email processing logs
CREATE POLICY "Admins can view email processing logs" 
ON public.email_processing_log 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- Create policy for system to insert logs
CREATE POLICY "System can insert email processing logs" 
ON public.email_processing_log 
FOR INSERT 
WITH CHECK (true);