-- Fix remaining Function Search Path Mutable warnings for additional functions

-- Fix check_user_permission function
CREATE OR REPLACE FUNCTION public.check_user_permission(user_id uuid, module_name text, action_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT rp.enabled
      FROM public.role_permissions rp
      JOIN public.permission_modules pm ON rp.module_id = pm.id
      JOIN public.permission_actions pa ON rp.action_id = pa.id
      JOIN public.profiles p ON p.role = rp.role
      WHERE p.id = user_id
        AND pm.name = module_name
        AND pa.name = action_name
    ),
    false
  );
END;
$$;

-- Fix encrypt_smtp_password function
CREATE OR REPLACE FUNCTION public.encrypt_smtp_password(password_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF password_text IS NULL OR password_text = '' THEN
    RETURN password_text;
  END IF;
  
  -- Use a combination of the password and a salt for encryption
  -- In production, you should use a more secure key management approach
  RETURN encode(
    encrypt(
      password_text::bytea, 
      'smtp_encryption_key_2025'::bytea, 
      'aes'
    ), 
    'base64'
  );
END;
$$;

-- Fix decrypt_smtp_password function
CREATE OR REPLACE FUNCTION public.decrypt_smtp_password(encrypted_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF encrypted_password IS NULL OR encrypted_password = '' THEN
    RETURN encrypted_password;
  END IF;
  
  RETURN convert_from(
    decrypt(
      decode(encrypted_password, 'base64'),
      'smtp_encryption_key_2025'::bytea,
      'aes'
    ),
    'UTF8'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If decryption fails, return the original value (for backward compatibility)
    RETURN encrypted_password;
END;
$$;

-- Fix get_table_columns function
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name text)
RETURNS TABLE(column_name text, data_type text)
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT 
    c.column_name::text,
    c.data_type::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' 
    AND c.table_name = get_table_columns.table_name
  ORDER BY c.ordinal_position;
$$;

-- Fix process_email_template function
CREATE OR REPLACE FUNCTION public.process_email_template(template_content text, record_data jsonb)
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
AS $$
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
$$;

-- Fix process_email_queue function
CREATE OR REPLACE FUNCTION public.process_email_queue(batch_size integer DEFAULT 10)
RETURNS TABLE(processed_count integer, failed_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  queue_record RECORD;
  processed INTEGER := 0;
  failed INTEGER := 0;
BEGIN
  -- Get pending emails to process
  FOR queue_record IN 
    SELECT * FROM public.email_queue 
    WHERE status = 'pending' 
      AND scheduled_at <= NOW()
    ORDER BY created_at ASC
    LIMIT batch_size
  LOOP
    -- Mark as sent (this would normally be done after successful email sending)
    UPDATE public.email_queue 
    SET status = 'sent', sent_at = NOW(), updated_at = NOW()
    WHERE id = queue_record.id;
    
    -- Log the sent event
    INSERT INTO public.email_logs (queue_id, event_type, event_data)
    VALUES (
      queue_record.id,
      'sent',
      jsonb_build_object(
        'sent_at', NOW(),
        'recipient', queue_record.recipient_email
      )
    );
    
    processed := processed + 1;
  END LOOP;
  
  RETURN QUERY SELECT processed, failed;
END;
$$;