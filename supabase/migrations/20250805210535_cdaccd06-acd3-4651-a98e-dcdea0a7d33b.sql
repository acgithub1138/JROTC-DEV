-- Create the missing replace_template_variables function
CREATE OR REPLACE FUNCTION public.replace_template_variables(
  template_text TEXT,
  data_json JSONB
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  result_text TEXT;
  key TEXT;
  value TEXT;
BEGIN
  result_text := template_text;
  
  -- Loop through all keys in the JSON object
  FOR key IN SELECT jsonb_object_keys(data_json)
  LOOP
    -- Get the value for this key
    value := COALESCE(data_json ->> key, '');
    
    -- Replace template variables in format {{key}} with the actual value
    result_text := REPLACE(result_text, '{{' || key || '}}', value);
  END LOOP;
  
  RETURN result_text;
END;
$$;