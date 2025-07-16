-- Queue optimization improvements: retry logic, monitoring, and health checks

-- Add retry mechanism columns to email_queue
ALTER TABLE public.email_queue 
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create queue health monitoring table
CREATE TABLE IF NOT EXISTS public.email_queue_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id),
  check_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  pending_count INTEGER NOT NULL DEFAULT 0,
  stuck_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  processing_time_avg_ms INTEGER DEFAULT NULL,
  health_status TEXT NOT NULL DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'warning', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on health table
ALTER TABLE public.email_queue_health ENABLE ROW LEVEL SECURITY;

-- Create policies for health monitoring
CREATE POLICY "Admins can view all email queue health" 
ON public.email_queue_health 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Schools can view their email queue health" 
ON public.email_queue_health 
FOR SELECT 
USING (school_id = get_current_user_school_id());

CREATE POLICY "System can insert email queue health" 
ON public.email_queue_health 
FOR INSERT 
WITH CHECK (true);

-- Function to check and update queue health
CREATE OR REPLACE FUNCTION public.check_email_queue_health()
RETURNS TABLE(school_id UUID, health_status TEXT, pending_count BIGINT, stuck_count BIGINT, failed_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  school_record RECORD;
  pending_emails BIGINT;
  stuck_emails BIGINT;
  failed_emails BIGINT;
  health_status_val TEXT;
BEGIN
  FOR school_record IN SELECT id FROM public.schools LOOP
    -- Count pending emails
    SELECT COUNT(*) INTO pending_emails
    FROM public.email_queue
    WHERE email_queue.school_id = school_record.id AND status = 'pending';
    
    -- Count stuck emails (pending for more than 10 minutes)
    SELECT COUNT(*) INTO stuck_emails
    FROM public.email_queue
    WHERE email_queue.school_id = school_record.id 
      AND status = 'pending' 
      AND created_at < (now() - INTERVAL '10 minutes');
    
    -- Count failed emails in the last hour
    SELECT COUNT(*) INTO failed_emails
    FROM public.email_queue
    WHERE email_queue.school_id = school_record.id 
      AND status = 'failed' 
      AND updated_at > (now() - INTERVAL '1 hour');
    
    -- Determine health status
    IF stuck_emails > 10 OR failed_emails > 20 THEN
      health_status_val := 'critical';
    ELSIF stuck_emails > 5 OR failed_emails > 10 THEN
      health_status_val := 'warning';
    ELSE
      health_status_val := 'healthy';
    END IF;
    
    -- Insert health record
    INSERT INTO public.email_queue_health (
      school_id, pending_count, stuck_count, failed_count, health_status
    ) VALUES (
      school_record.id, pending_emails::INTEGER, stuck_emails::INTEGER, failed_emails::INTEGER, health_status_val
    );
    
    -- Return for monitoring
    RETURN QUERY SELECT school_record.id, health_status_val, pending_emails, stuck_emails, failed_emails;
  END LOOP;
END;
$$;

-- Function to retry stuck emails
CREATE OR REPLACE FUNCTION public.retry_stuck_emails(max_age_minutes INTEGER DEFAULT 10)
RETURNS TABLE(email_id UUID, school_id UUID, retry_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update stuck emails to retry
  UPDATE public.email_queue
  SET 
    status = 'pending',
    retry_count = retry_count + 1,
    next_retry_at = now() + (INTERVAL '5 minutes' * retry_count),
    last_attempt_at = now(),
    error_message = COALESCE(error_message, '') || ' | Retried at ' || now()::text,
    updated_at = now()
  WHERE status = 'pending'
    AND created_at < (now() - (max_age_minutes || ' minutes')::INTERVAL)
    AND retry_count < max_retries
    AND (next_retry_at IS NULL OR next_retry_at <= now());

  -- Return the retried emails
  RETURN QUERY 
  SELECT eq.id, eq.school_id, eq.retry_count
  FROM public.email_queue eq
  WHERE eq.last_attempt_at >= (now() - INTERVAL '1 minute')
    AND eq.retry_count > 0;
END;
$$;

-- Improved webhook trigger with retry logic
CREATE OR REPLACE FUNCTION public.trigger_email_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  webhook_error TEXT;
  max_retry_attempts INTEGER := 3;
  current_retry INTEGER;
BEGIN
  -- Only trigger for pending emails
  IF NEW.status = 'pending' THEN
    -- Check if this is a retry and if we've exceeded max attempts
    current_retry := COALESCE(NEW.retry_count, 0);
    
    -- Skip if we've exceeded max retries
    IF current_retry >= max_retry_attempts THEN
      -- Mark as failed
      UPDATE public.email_queue 
      SET status = 'failed', 
          error_message = 'Max retry attempts exceeded',
          updated_at = now()
      WHERE id = NEW.id;
      
      RETURN NEW;
    END IF;
    
    -- Check if scheduled for future (retry logic)
    IF NEW.next_retry_at IS NOT NULL AND NEW.next_retry_at > now() THEN
      RETURN NEW; -- Skip for now, will be processed later
    END IF;
    
    BEGIN
      -- Log attempt
      INSERT INTO public.webhook_trigger_log (email_id, status, error_message) 
      VALUES (NEW.id, 'attempting', 'Retry attempt: ' || current_retry::text);
      
      -- Call the webhook with exponential backoff handling
      PERFORM net.http_post(
        url := 'https://vpiwfabbzaebfkadmmgd.supabase.co/functions/v1/email-queue-webhook',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaXdmYWJiemFlYmZrYWRtbWdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDcxMDIyOSwiZXhwIjoyMDY2Mjg2MjI5fQ.MdcIjFOevGAZXlPf5q6-XBqB2aVBdJyDwjNhA77YyGg"}'::jsonb,
        body := json_build_object('email_id', NEW.id, 'retry_count', current_retry)::jsonb,
        timeout_milliseconds := 30000
      );
      
      -- Log success
      INSERT INTO public.webhook_trigger_log (email_id, status, error_message) 
      VALUES (NEW.id, 'success', 'Webhook called successfully (attempt: ' || current_retry::text || ')');
      
    EXCEPTION WHEN OTHERS THEN
      webhook_error := SQLERRM;
      
      -- Log the error
      INSERT INTO public.webhook_trigger_log (email_id, status, error_message) 
      VALUES (NEW.id, 'error', 'Webhook failed (attempt ' || current_retry::text || '): ' || webhook_error);
      
      -- Schedule retry with exponential backoff
      UPDATE public.email_queue 
      SET 
        retry_count = current_retry + 1,
        next_retry_at = now() + (INTERVAL '2 minutes' * POWER(2, current_retry)), -- 2, 4, 8 minutes
        last_attempt_at = now(),
        error_message = webhook_error,
        updated_at = now()
      WHERE id = NEW.id;
      
      -- Don't raise the error to avoid blocking the main operation
      RAISE WARNING 'Webhook trigger failed for email % (attempt %): %', NEW.id, current_retry, webhook_error;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create index for better queue monitoring performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status_created ON public.email_queue (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_queue_retry_scheduled ON public.email_queue (next_retry_at) WHERE next_retry_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_queue_health_timestamp ON public.email_queue_health (check_timestamp DESC);

-- Function to process batch emails (for high-volume optimization)
CREATE OR REPLACE FUNCTION public.process_email_batch(batch_size INTEGER DEFAULT 10)
RETURNS TABLE(processed_count INTEGER, failed_count INTEGER, details JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  queue_record RECORD;
  processed INTEGER := 0;
  failed INTEGER := 0;
  details_array JSONB[] := '{}';
  batch_details JSONB;
BEGIN
  -- Process pending emails in batch
  FOR queue_record IN 
    SELECT id, recipient_email, subject, retry_count
    FROM public.email_queue 
    WHERE status = 'pending' 
      AND (next_retry_at IS NULL OR next_retry_at <= now())
      AND scheduled_at <= now()
    ORDER BY created_at ASC
    LIMIT batch_size
  LOOP
    BEGIN
      -- Call the webhook for each email
      PERFORM net.http_post(
        url := 'https://vpiwfabbzaebfkadmmgd.supabase.co/functions/v1/email-queue-webhook',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwaXdmYWJiemFlYmZrYWRtbWdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDcxMDIyOSwiZXhwIjoyMDY2Mjg2MjI5fQ.MdcIjFOevGAZXlPf5q6-XBqB2aVBdJyDwjNhA77YyGg"}'::jsonb,
        body := json_build_object('email_id', queue_record.id, 'batch_processing', true)::jsonb,
        timeout_milliseconds := 30000
      );
      
      processed := processed + 1;
      details_array := details_array || jsonb_build_object(
        'email_id', queue_record.id,
        'status', 'processed',
        'recipient', queue_record.recipient_email
      );
      
    EXCEPTION WHEN OTHERS THEN
      failed := failed + 1;
      details_array := details_array || jsonb_build_object(
        'email_id', queue_record.id,
        'status', 'failed',
        'error', SQLERRM,
        'recipient', queue_record.recipient_email
      );
    END;
  END LOOP;
  
  batch_details := jsonb_build_object(
    'processed_emails', details_array,
    'timestamp', now(),
    'batch_size', batch_size
  );
  
  RETURN QUERY SELECT processed, failed, batch_details;
END;
$$;