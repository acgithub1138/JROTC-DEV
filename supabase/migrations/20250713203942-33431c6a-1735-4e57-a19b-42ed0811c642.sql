-- Create the encrypt_smtp_password function
CREATE OR REPLACE FUNCTION public.encrypt_smtp_password(password_text text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;

-- Create the decrypt_smtp_password function
CREATE OR REPLACE FUNCTION public.decrypt_smtp_password(encrypted_password text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;

-- Create the trigger function for automatic encryption
CREATE OR REPLACE FUNCTION public.encrypt_smtp_password_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Only encrypt if the password appears to be unencrypted
  -- (simple check: if it doesn't look like base64, encrypt it)
  IF NEW.smtp_password IS NOT NULL 
     AND NEW.smtp_password != OLD.smtp_password 
     AND NEW.smtp_password !~ '^[A-Za-z0-9+/]*={0,2}$' THEN
    NEW.smtp_password := encrypt_smtp_password(NEW.smtp_password);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger to automatically encrypt SMTP passwords
DROP TRIGGER IF EXISTS encrypt_smtp_password_trigger ON public.smtp_settings;
CREATE TRIGGER encrypt_smtp_password_trigger
  BEFORE INSERT OR UPDATE ON public.smtp_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_smtp_password_trigger();