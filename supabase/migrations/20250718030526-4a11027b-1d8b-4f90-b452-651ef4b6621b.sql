-- Fix email template processing function to properly handle all variables
CREATE OR REPLACE FUNCTION public.process_email_template(template_content text, record_data jsonb)
RETURNS text
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  result text := template_content;
  key text;
  value text;
  formatted_value text;
  is_date_field boolean;
  parsed_date timestamp;
  nested_keys text[];
  nested_value jsonb;
  final_value text;
BEGIN
  -- First, handle nested object access (e.g., {{assigned_to.first_name}})
  -- Find all patterns like {{object.property}}
  WHILE result ~ '\{\{[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\}\}' LOOP
    -- Extract the pattern
    SELECT regexp_replace(
      (regexp_match(result, '\{\{([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)\}\}'))[1], 
      '\.', '_', 'g'
    ) INTO key;
    
    -- Get the nested value using the underscore format
    IF record_data ? key THEN
      final_value := record_data ->> key;
    ELSE
      final_value := '';
    END IF;
    
    -- Replace the pattern
    result := regexp_replace(
      result, 
      '\{\{[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\}\}', 
      COALESCE(final_value, ''), 
      1
    );
  END LOOP;
  
  -- Then handle flat variables in format {{variable_name}}
  FOR key, value IN SELECT * FROM jsonb_each_text(record_data)
  LOOP
    -- Only skip the actual nested object keys (like 'assigned_to', 'created_by', 'assigned_to_admin')
    -- that have corresponding flattened versions, but allow all flattened fields to be processed
    IF key IN ('assigned_to', 'created_by', 'assigned_by', 'assigned_to_admin') AND 
       jsonb_typeof(record_data->key) = 'object' THEN
      CONTINUE;
    END IF;
    
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