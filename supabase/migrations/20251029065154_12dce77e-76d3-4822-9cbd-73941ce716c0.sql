-- Function to delete attachments and their storage files when a record is deleted
CREATE OR REPLACE FUNCTION public.delete_record_attachments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  attachment_record RECORD;
  mapped_record_type TEXT;
BEGIN
  -- Map table names to record_type values used in attachments table
  mapped_record_type := CASE TG_TABLE_NAME
    WHEN 'tasks' THEN 'task'
    WHEN 'subtasks' THEN 'subtask'
    WHEN 'incidents' THEN 'incident'
    WHEN 'announcements' THEN 'announcement'
    WHEN 'budget_transactions' THEN 'budget_transaction'
    WHEN 'events' THEN 'event'
    WHEN 'competition_events' THEN 'competition_event'
    ELSE TG_TABLE_NAME
  END;

  -- Find all attachments for this record
  FOR attachment_record IN 
    SELECT id, file_path 
    FROM public.attachments 
    WHERE record_type = mapped_record_type
      AND record_id = OLD.id
  LOOP
    -- Delete file from storage using storage.objects table
    DELETE FROM storage.objects 
    WHERE bucket_id = 'task-incident-attachments' 
      AND name = attachment_record.file_path;
    
    -- Delete attachment record
    DELETE FROM public.attachments WHERE id = attachment_record.id;
  END LOOP;
  
  RETURN OLD;
END;
$function$;

-- Create triggers for all tables that use attachments
DROP TRIGGER IF EXISTS delete_attachments_on_task_delete ON public.tasks;
CREATE TRIGGER delete_attachments_on_task_delete
  BEFORE DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_record_attachments();

DROP TRIGGER IF EXISTS delete_attachments_on_subtask_delete ON public.subtasks;
CREATE TRIGGER delete_attachments_on_subtask_delete
  BEFORE DELETE ON public.subtasks
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_record_attachments();

DROP TRIGGER IF EXISTS delete_attachments_on_incident_delete ON public.incidents;
CREATE TRIGGER delete_attachments_on_incident_delete
  BEFORE DELETE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_record_attachments();

DROP TRIGGER IF EXISTS delete_attachments_on_announcement_delete ON public.announcements;
CREATE TRIGGER delete_attachments_on_announcement_delete
  BEFORE DELETE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_record_attachments();

DROP TRIGGER IF EXISTS delete_attachments_on_competition_event_delete ON public.competition_events;
CREATE TRIGGER delete_attachments_on_competition_event_delete
  BEFORE DELETE ON public.competition_events
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_record_attachments();

DROP TRIGGER IF EXISTS delete_attachments_on_budget_delete ON public.budget_transactions;
CREATE TRIGGER delete_attachments_on_budget_delete
  BEFORE DELETE ON public.budget_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_record_attachments();

DROP TRIGGER IF EXISTS delete_attachments_on_event_delete ON public.events;
CREATE TRIGGER delete_attachments_on_event_delete
  BEFORE DELETE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_record_attachments();