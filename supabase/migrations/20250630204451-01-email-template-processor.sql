
-- Email template processing function
CREATE OR REPLACE FUNCTION public.process_email_template(template_content text, record_data jsonb)
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  result text := template_content;
  key text;
  value text;
  formatted_value text;
  is_date_field boolean;
  parsed_date timestamp;
BEGIN
  -- Replace variables in format {{variable_name}}
  FOR key, value IN SELECT * FROM jsonb_each_text(record_data)
  LOOP
    -- Check if the field name suggests it's a date field
    is_date_field := (
      key ILIKE '%date%' OR 
      key ILIKE '%_at' OR 
      key ILIKE '%_on'
    );
    
    formatted_value := value;
    
    -- If it looks like a date field and has a value, try to format it
    IF is_date_field AND value IS NOT NULL AND value != '' THEN
      BEGIN
        -- Try to parse the value as a timestamp
        parsed_date := value::timestamp;
        -- Format as MM/DD/YYYY
        formatted_value := to_char(parsed_date, 'MM/DD/YYYY');
      EXCEPTION WHEN OTHERS THEN
        -- If parsing fails, use the original value
        formatted_value := value;
      END;
    END IF;
    
    result := replace(result, '{{' || key || '}}', COALESCE(formatted_value, ''));
  END LOOP;
  
  RETURN result;
END;
$function$;
