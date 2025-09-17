-- Tighten delayed email timing: require events or 5-min fallback, then run once
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
  skipped_no_events integer := 0;
  error_count integer := 0;
  results jsonb;
BEGIN
  RAISE LOG 'Starting delayed competition registration email processing at %', now();

  FOR registration_record IN 
    SELECT cs.id, cs.school_id, cs.competition_id, cs.created_at
    FROM public.cp_comp_schools cs
    WHERE cs.created_at > (now() - INTERVAL '10 minutes')
      AND cs.created_at < (now() - INTERVAL '45 seconds') -- ensure brief delay
      AND NOT EXISTS (
        SELECT 1 FROM public.email_queue eq 
        WHERE eq.source_table = 'cp_comp_schools' 
          AND eq.record_id = cs.id 
          AND eq.status IN ('sent', 'pending', 'processing')
      )
    ORDER BY cs.created_at ASC
  LOOP
    BEGIN
      SELECT COUNT(*) INTO event_count
      FROM public.cp_event_registrations er
      WHERE er.school_id = registration_record.school_id
        AND er.competition_id = registration_record.competition_id;
      
      RAISE LOG 'Registration % created %, events=%', registration_record.id, registration_record.created_at, event_count;

      -- Only proceed if events exist OR it's older than 5 minutes (fallback)
      IF event_count = 0 AND registration_record.created_at >= (now() - INTERVAL '5 minutes') THEN
        skipped_no_events := skipped_no_events + 1;
        RAISE LOG 'Skipping %: no events yet and younger than 5 minutes', registration_record.id;
        CONTINUE;
      END IF;

      SELECT * INTO template_record
      FROM public.email_templates et
      WHERE et.school_id IS NULL
        AND et.source_table = 'cp_comp_schools'
        AND et.name ILIKE '%comp%registration%confirmation%'
        AND et.is_active = true
      LIMIT 1;
      
      IF template_record.id IS NOT NULL THEN
        SELECT email INTO recipient_email
        FROM public.schools 
        WHERE id = registration_record.school_id
          AND email IS NOT NULL 
          AND email != '';
        
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

        IF recipient_email IS NOT NULL AND recipient_email != '' THEN
          SELECT public.queue_email(
            template_record.id,
            recipient_email,
            'cp_comp_schools',
            registration_record.id,
            registration_record.school_id
          ) INTO queue_item_id;
          
          processed_count := processed_count + 1;
          RAISE LOG 'Queued delayed registration email: reg_id=%, queue_id=%, recipient=%, events=%',
            registration_record.id, queue_item_id, recipient_email, event_count;
        ELSE
          error_count := error_count + 1;
          RAISE LOG 'No recipient email found for school_id=%', registration_record.school_id;
        END IF;
      ELSE
        error_count := error_count + 1;
        RAISE LOG 'No active global template found for competition registration';
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE LOG 'Error processing registration %: %', registration_record.id, SQLERRM;
    END;
  END LOOP;

  results := jsonb_build_object(
    'success', true,
    'processed_count', processed_count,
    'skipped_no_events', skipped_no_events,
    'error_count', error_count,
    'processed_at', now()
  );

  RAISE LOG 'Completed delayed email processing: processed=%, skipped=%, errors=%', processed_count, skipped_no_events, error_count;
  
  RETURN results;
END;
$function$;

-- Run once now
SELECT public.process_delayed_comp_registration_emails();