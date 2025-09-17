-- Create a more robust delayed email system with better timing
-- First, let's create a function that can be called manually or via cron
CREATE OR REPLACE FUNCTION public.process_delayed_comp_registration_emails()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  registration_record RECORD;
  template_record RECORD;
  recipient_email text;
  queue_item_id UUID;
  event_count integer;
  processed_count integer := 0;
  error_count integer := 0;
  results jsonb;
BEGIN
  -- Log the start of delayed email processing
  RAISE LOG 'Starting delayed competition registration email processing at %', now();

  -- Process cp_comp_schools records created in the last 10 minutes that haven't had emails sent yet
  FOR registration_record IN 
    SELECT cs.id, cs.school_id, cs.competition_id, cs.created_at
    FROM public.cp_comp_schools cs
    WHERE cs.created_at > (now() - INTERVAL '10 minutes')
      AND cs.created_at < (now() - INTERVAL '15 seconds') -- At least 15 seconds old
      AND NOT EXISTS (
        -- Check if we already sent an email for this registration
        SELECT 1 FROM public.email_queue eq 
        WHERE eq.source_table = 'cp_comp_schools' 
          AND eq.record_id = cs.id 
          AND eq.status IN ('sent', 'pending', 'processing')
      )
  LOOP
    BEGIN
      -- Check if this registration has event registrations
      SELECT COUNT(*) INTO event_count
      FROM public.cp_event_registrations er
      WHERE er.school_id = registration_record.school_id
        AND er.competition_id = registration_record.competition_id;
      
      RAISE LOG 'Processing registration %, found % events', registration_record.id, event_count;
      
      -- Always send email regardless of event count (for testing)
      -- Find the global competition registration template
      SELECT * INTO template_record
      FROM public.email_templates et
      WHERE et.school_id IS NULL
        AND et.source_table = 'cp_comp_schools'
        AND et.name ILIKE '%comp%registration%confirmation%'
        AND et.is_active = true
      LIMIT 1;
      
      IF template_record.id IS NOT NULL THEN
        -- Determine recipient email (same logic as the original trigger)
        SELECT email INTO recipient_email
        FROM public.schools 
        WHERE id = registration_record.school_id
          AND email IS NOT NULL 
          AND email != '';
        
        -- If no school email, find an admin from that school
        IF recipient_email IS NULL OR recipient_email = '' THEN
          SELECT p.email INTO recipient_email
          FROM public.profiles p
          JOIN public.user_roles ur ON p.role_id = ur.id
          WHERE p.school_id = registration_record.school_id
            AND ur.role_name = 'admin'
            AND p.active = true
            AND p.email IS NOT NULL
            AND p.email != ''
          LIMIT 1;
        END IF;

        -- If still no email found, try instructor role
        IF recipient_email IS NULL OR recipient_email = '' THEN
          SELECT p.email INTO recipient_email
          FROM public.profiles p
          JOIN public.user_roles ur ON p.role_id = ur.id
          WHERE p.school_id = registration_record.school_id
            AND ur.role_name = 'instructor'
            AND p.active = true
            AND p.email IS NOT NULL
            AND p.email != ''
          LIMIT 1;
        END IF;

        -- Queue the email if we have a recipient
        IF recipient_email IS NOT NULL AND recipient_email != '' THEN
          SELECT public.queue_email(
            template_record.id,
            recipient_email,
            'cp_comp_schools',
            registration_record.id,
            registration_record.school_id
          ) INTO queue_item_id;
          
          processed_count := processed_count + 1;
          
          RAISE LOG 'Delayed competition registration email queued: registration_id=%, queue_id=%, recipient=%, event_count=%', 
            registration_record.id, queue_item_id, recipient_email, event_count;
        ELSE
          error_count := error_count + 1;
          RAISE LOG 'No recipient email found for delayed competition registration: school_id=%', registration_record.school_id;
        END IF;
      ELSE
        error_count := error_count + 1;
        RAISE LOG 'No email template found for competition registration';
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE LOG 'Error processing registration %: %', registration_record.id, SQLERRM;
    END;
  END LOOP;

  results := jsonb_build_object(
    'success', true,
    'processed_count', processed_count,
    'error_count', error_count,
    'processed_at', now()
  );

  RAISE LOG 'Completed delayed email processing: processed=%, errors=%', processed_count, error_count;
  
  RETURN results;
END;
$function$;

-- Test the function immediately to process current registrations
SELECT public.process_delayed_comp_registration_emails();