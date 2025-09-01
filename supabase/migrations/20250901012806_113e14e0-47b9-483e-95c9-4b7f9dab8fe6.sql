-- Update the record_type check constraint to include budget_transaction
ALTER TABLE public.attachments 
DROP CONSTRAINT IF EXISTS attachments_record_type_check;

ALTER TABLE public.attachments 
ADD CONSTRAINT attachments_record_type_check 
CHECK (record_type IN ('task', 'subtask', 'incident', 'announcement', 'budget_transaction'));

-- Update the attachment tracking trigger function to handle budget_transaction
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
  -- Only track attachments for tasks, subtasks, and budget_transactions
  IF (TG_OP = 'INSERT' AND NEW.record_type NOT IN ('task', 'subtask', 'budget_transaction')) OR 
     (TG_OP = 'DELETE' AND OLD.record_type NOT IN ('task', 'subtask', 'budget_transaction')) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Skip comment tracking for budget_transaction (no comment tables)
  IF (TG_OP = 'INSERT' AND NEW.record_type = 'budget_transaction') OR 
     (TG_OP = 'DELETE' AND OLD.record_type = 'budget_transaction') THEN
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