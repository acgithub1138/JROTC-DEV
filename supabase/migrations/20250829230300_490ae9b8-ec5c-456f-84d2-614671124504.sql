-- Create function to deactivate expired announcements
CREATE OR REPLACE FUNCTION public.deactivate_expired_announcements()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  updated_count INTEGER := 0;
  announcement_record RECORD;
BEGIN
  -- Log the start of processing
  RAISE LOG 'Starting expired announcement deactivation at %', now();

  -- Update expired announcements to inactive
  FOR announcement_record IN 
    SELECT id, title, expire_date, school_id
    FROM public.announcements
    WHERE expire_date < CURRENT_DATE
      AND is_active = true
  LOOP
    -- Update the announcement to inactive
    UPDATE public.announcements 
    SET is_active = false,
        updated_at = now()
    WHERE id = announcement_record.id;
    
    updated_count := updated_count + 1;
    
    RAISE LOG 'Deactivated announcement: id=%, title=%, expire_date=%', 
      announcement_record.id, announcement_record.title, announcement_record.expire_date;
  END LOOP;

  -- Log completion
  RAISE LOG 'Completed expired announcement deactivation: updated_count=%', updated_count;

  RETURN jsonb_build_object(
    'success', true,
    'updated_count', updated_count,
    'processed_at', now()
  );
END;
$function$