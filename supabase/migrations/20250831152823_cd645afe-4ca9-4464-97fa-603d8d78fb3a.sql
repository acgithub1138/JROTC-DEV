-- Create function to handle attachment tracking for tasks and subtasks
CREATE OR REPLACE FUNCTION public.handle_attachment_tracking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  comment_text TEXT;
  user_profile RECORD;
BEGIN
  -- Only track attachments for tasks and subtasks
  IF (TG_OP = 'INSERT' AND NEW.record_type NOT IN ('task', 'subtask')) OR 
     (TG_OP = 'DELETE' AND OLD.record_type NOT IN ('task', 'subtask')) THEN
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
$$;

-- Create triggers for attachment tracking
CREATE TRIGGER attachment_added_trigger
  AFTER INSERT ON public.attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_attachment_tracking();

CREATE TRIGGER attachment_removed_trigger
  AFTER DELETE ON public.attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_attachment_tracking();