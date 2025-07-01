
-- Function to process email queue (can be called by edge function)
CREATE OR REPLACE FUNCTION public.process_email_queue(batch_size INTEGER DEFAULT 10)
RETURNS TABLE(processed_count INTEGER, failed_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  queue_record RECORD;
  processed INTEGER := 0;
  failed INTEGER := 0;
BEGIN
  -- Get pending emails to process
  FOR queue_record IN 
    SELECT * FROM email_queue 
    WHERE status = 'pending' 
      AND scheduled_at <= NOW()
    ORDER BY created_at ASC
    LIMIT batch_size
  LOOP
    -- Mark as sent (this would normally be done after successful email sending)
    UPDATE email_queue 
    SET status = 'sent', sent_at = NOW(), updated_at = NOW()
    WHERE id = queue_record.id;
    
    -- Update task comment to reflect email sent (only for tasks)
    IF queue_record.source_table = 'tasks' THEN
      UPDATE task_comments 
      SET comment_text = 'Email sent to ' || queue_record.recipient_email || ' - [Preview Email](' || queue_record.id || ')'
      WHERE task_id = queue_record.record_id 
        AND comment_text LIKE 'Email queued for sending to ' || queue_record.recipient_email || '%'
        AND is_system_comment = true;
    END IF;
    
    -- Log the sent event
    INSERT INTO email_logs (queue_id, event_type, event_data)
    VALUES (
      queue_record.id,
      'sent',
      jsonb_build_object(
        'sent_at', NOW(),
        'recipient', queue_record.recipient_email
      )
    );
    
    processed := processed + 1;
  END LOOP;
  
  RETURN QUERY SELECT processed, failed;
END;
$$;
