-- Function to create all email rules for a school
CREATE OR REPLACE FUNCTION public.create_email_rules_for_school(school_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Insert all 10 email rule types for the school
  INSERT INTO public.email_rules (school_id, rule_type, template_id, is_active, trigger_event)
  VALUES 
    (school_uuid, 'task_created', null, false, 'INSERT'),
    (school_uuid, 'task_information_needed', null, false, 'UPDATE'),
    (school_uuid, 'task_completed', null, false, 'UPDATE'),
    (school_uuid, 'task_canceled', null, false, 'UPDATE'),
    (school_uuid, 'task_overdue_reminder', null, false, 'UPDATE'),
    (school_uuid, 'subtask_created', null, false, 'INSERT'),
    (school_uuid, 'subtask_information_needed', null, false, 'UPDATE'),
    (school_uuid, 'subtask_completed', null, false, 'UPDATE'),
    (school_uuid, 'subtask_canceled', null, false, 'UPDATE'),
    (school_uuid, 'subtask_overdue_reminder', null, false, 'UPDATE')
  ON CONFLICT (school_id, rule_type) DO NOTHING;
END;
$function$;

-- Trigger function to automatically create email rules for new schools
CREATE OR REPLACE FUNCTION public.create_email_rules_on_school_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Create all email rules for the new school
  PERFORM public.create_email_rules_for_school(NEW.id);
  RETURN NEW;
END;
$function$;

-- Create trigger on schools table
DROP TRIGGER IF EXISTS trigger_create_email_rules_on_school_insert ON public.schools;
CREATE TRIGGER trigger_create_email_rules_on_school_insert
  AFTER INSERT ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.create_email_rules_on_school_insert();

-- Backfill missing email rules for all existing schools
DO $$
DECLARE
  school_record RECORD;
BEGIN
  FOR school_record IN 
    SELECT id FROM public.schools
  LOOP
    PERFORM public.create_email_rules_for_school(school_record.id);
  END LOOP;
END $$;