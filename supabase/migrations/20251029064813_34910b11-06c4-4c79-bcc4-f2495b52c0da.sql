-- Function to delete attachments and their storage files when a record is deleted
CREATE OR REPLACE FUNCTION public.delete_record_attachments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  attachment_record RECORD;
BEGIN
  -- Find all attachments for this record
  FOR attachment_record IN 
    SELECT id, file_path 
    FROM public.attachments 
    WHERE record_type = TG_TABLE_NAME 
      AND record_id = OLD.id
  LOOP
    -- Delete file from storage
    PERFORM storage.fdelete(
      'task-incident-attachments',
      attachment_record.file_path
    );
    
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

DROP TRIGGER IF EXISTS delete_attachments_on_event_delete ON public.competition_events;
CREATE TRIGGER delete_attachments_on_event_delete
  BEFORE DELETE ON public.competition_events
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_record_attachments();

DROP TRIGGER IF EXISTS delete_attachments_on_budget_delete ON public.budget_transactions;
CREATE TRIGGER delete_attachments_on_budget_delete
  BEFORE DELETE ON public.budget_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_record_attachments();

DROP TRIGGER IF EXISTS delete_attachments_on_cp_event_delete ON public.events;
CREATE TRIGGER delete_attachments_on_cp_event_delete
  BEFORE DELETE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_record_attachments();