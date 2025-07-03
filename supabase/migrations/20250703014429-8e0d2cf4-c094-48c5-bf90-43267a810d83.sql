-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function to encrypt SMTP passwords
CREATE OR REPLACE FUNCTION encrypt_smtp_password(password_text TEXT)
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to decrypt SMTP passwords
CREATE OR REPLACE FUNCTION decrypt_smtp_password(encrypted_password TEXT)
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to automatically encrypt passwords on insert/update
CREATE OR REPLACE FUNCTION encrypt_smtp_password_trigger()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on smtp_settings table
DROP TRIGGER IF EXISTS encrypt_smtp_password_on_change ON smtp_settings;
CREATE TRIGGER encrypt_smtp_password_on_change
  BEFORE INSERT OR UPDATE ON smtp_settings
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_smtp_password_trigger();

-- Encrypt existing passwords (if any)
UPDATE smtp_settings 
SET smtp_password = encrypt_smtp_password(smtp_password)
WHERE smtp_password IS NOT NULL 
  AND smtp_password != ''
  AND smtp_password !~ '^[A-Za-z0-9+/]*={0,2}$';