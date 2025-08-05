-- Clear the stale email processing lock to allow email processing to resume
UPDATE public.email_processing_lock 
SET 
  is_locked = false,
  locked_by = null,
  locked_at = null,
  last_error = null,
  last_processed_at = now()
WHERE id = 1;