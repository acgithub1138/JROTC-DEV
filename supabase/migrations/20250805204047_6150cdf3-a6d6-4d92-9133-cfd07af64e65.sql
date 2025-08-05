-- Add automatic lock timeout logic by creating a function to clear stale locks
CREATE OR REPLACE FUNCTION public.clear_stale_email_processing_locks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  stale_lock_threshold INTERVAL := '15 minutes';
  cleared_locks INTEGER := 0;
BEGIN
  -- Clear locks that are older than 15 minutes
  UPDATE public.email_processing_lock
  SET 
    is_locked = false,
    locked_by = null,
    locked_at = null,
    last_error = 'Lock cleared due to timeout after ' || stale_lock_threshold,
    last_processed_at = now()
  WHERE 
    is_locked = true
    AND locked_at < (now() - stale_lock_threshold);
    
  GET DIAGNOSTICS cleared_locks = ROW_COUNT;
  
  -- Log the cleared locks if any
  IF cleared_locks > 0 THEN
    INSERT INTO public.email_processing_log (
      status,
      processed_count,
      failed_count,
      request_id
    ) VALUES (
      'lock_timeout_cleared',
      cleared_locks,
      0,
      gen_random_uuid()
    );
  END IF;
  
  RETURN cleared_locks;
END;
$function$;

-- Create a function to check email queue health and detect stuck processing
CREATE OR REPLACE FUNCTION public.check_email_queue_health()
RETURNS TABLE(
  school_id uuid,
  pending_count integer,
  stuck_count integer,
  failed_count integer,
  processing_time_avg_ms integer,
  health_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  stuck_threshold INTERVAL := '10 minutes';
  health_record RECORD;
BEGIN
  -- Check each school's email queue health
  FOR health_record IN
    SELECT 
      eq.school_id,
      COUNT(CASE WHEN eq.status = 'pending' THEN 1 END)::integer as pending_count,
      COUNT(CASE WHEN eq.status = 'processing' AND eq.last_attempt_at < (now() - stuck_threshold) THEN 1 END)::integer as stuck_count,
      COUNT(CASE WHEN eq.status = 'failed' THEN 1 END)::integer as failed_count,
      COALESCE(
        EXTRACT(EPOCH FROM AVG(eq.sent_at - eq.created_at))::integer * 1000,
        NULL
      )::integer as processing_time_avg_ms
    FROM public.email_queue eq
    WHERE eq.created_at > (now() - INTERVAL '24 hours')
    GROUP BY eq.school_id
  LOOP
    -- Determine health status
    DECLARE
      status_text text := 'healthy';
    BEGIN
      IF health_record.stuck_count > 5 THEN
        status_text := 'critical';
      ELSIF health_record.stuck_count > 0 OR health_record.pending_count > 20 THEN
        status_text := 'warning';
      ELSIF health_record.failed_count > 10 THEN
        status_text := 'degraded';
      END IF;
      
      -- Insert health record
      INSERT INTO public.email_queue_health (
        school_id,
        pending_count,
        stuck_count,
        failed_count,
        processing_time_avg_ms,
        health_status
      ) VALUES (
        health_record.school_id,
        health_record.pending_count,
        health_record.stuck_count,
        health_record.failed_count,
        health_record.processing_time_avg_ms,
        status_text
      );
      
      -- Return the result
      school_id := health_record.school_id;
      pending_count := health_record.pending_count;
      stuck_count := health_record.stuck_count;
      failed_count := health_record.failed_count;
      processing_time_avg_ms := health_record.processing_time_avg_ms;
      health_status := status_text;
      
      RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$function$;

-- Schedule automatic lock cleanup every 5 minutes
SELECT cron.schedule(
  'clear-stale-email-locks',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT public.clear_stale_email_processing_locks();
  $$
);

-- Schedule email queue health monitoring every 15 minutes  
SELECT cron.schedule(
  'email-queue-health-check',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT public.check_email_queue_health();
  $$
);