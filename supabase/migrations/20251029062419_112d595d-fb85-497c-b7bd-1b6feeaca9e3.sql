-- Update handle_attachment_tracking to support competition_event
CREATE OR REPLACE FUNCTION public.handle_attachment_tracking()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  comment_text TEXT;
  user_profile RECORD;
BEGIN
  -- Only track attachments for tasks, subtasks, incidents, budget_transactions, events, and competition_events
  IF (TG_OP = 'INSERT' AND NEW.record_type NOT IN ('task', 'subtask', 'incident', 'budget_transaction', 'event', 'competition_event')) OR 
     (TG_OP = 'DELETE' AND OLD.record_type NOT IN ('task', 'subtask', 'incident', 'budget_transaction', 'event', 'competition_event')) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Skip comment tracking for budget_transaction, event, and competition_event (no comment tables)
  IF (TG_OP = 'INSERT' AND NEW.record_type IN ('budget_transaction', 'event', 'competition_event')) OR 
     (TG_OP = 'DELETE' AND OLD.record_type IN ('budget_transaction', 'event', 'competition_event')) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Get user profile information for the uploaded_by user
  IF TG_OP = 'INSERT' THEN
    SELECT first_name, last_name INTO user_profile
    FROM public.profiles 
    WHERE id = NEW.uploaded_by;
    
    comment_text := 'Attachment added: ' || NEW.file_name;
    
    -- Insert system comment based on record type
    IF NEW.record_type = 'task' THEN
      INSERT INTO public.task_comments (
        task_id,
        user_id,
        comment_text,
        is_system_comment,
        created_at
      ) VALUES (
        NEW.record_id,
        NEW.uploaded_by,
        comment_text,
        true,
        now()
      );
    ELSIF NEW.record_type = 'subtask' THEN
      INSERT INTO public.subtask_comments (
        subtask_id,
        user_id,
        comment_text,
        is_system_comment,
        created_at
      ) VALUES (
        NEW.record_id,
        NEW.uploaded_by,
        comment_text,
        true,
        now()
      );
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    SELECT first_name, last_name INTO user_profile
    FROM public.profiles 
    WHERE id = OLD.uploaded_by;
    
    comment_text := 'Attachment removed: ' || OLD.file_name;
    
    -- Insert system comment based on record type
    -- For DELETE, we'll use the system user (first admin) since we don't know who deleted it
    IF OLD.record_type = 'task' THEN
      INSERT INTO public.task_comments (
        task_id,
        user_id,
        comment_text,
        is_system_comment,
        created_at
      ) VALUES (
        OLD.record_id,
        OLD.uploaded_by, -- Use the original uploader as the user_id for system tracking
        comment_text,
        true,
        now()
      );
    ELSIF OLD.record_type = 'subtask' THEN
      INSERT INTO public.subtask_comments (
        subtask_id,
        user_id,
        comment_text,
        is_system_comment,
        created_at
      ) VALUES (
        OLD.record_id,
        OLD.uploaded_by, -- Use the original uploader as the user_id for system tracking
        comment_text,
        true,
        now()
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;