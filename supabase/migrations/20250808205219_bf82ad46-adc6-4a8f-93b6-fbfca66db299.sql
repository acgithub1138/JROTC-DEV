-- Redact SMTP password at the database layer and prevent future storage
DO $$
BEGIN
  -- Ensure smtp_settings table and smtp_password column exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'smtp_settings' 
      AND column_name = 'smtp_password'
  ) THEN
    -- Null out any previously stored passwords
    EXECUTE 'UPDATE public.smtp_settings SET smtp_password = NULL';

    -- Function to always nullify smtp_password on insert/update
    EXECUTE $$
      CREATE OR REPLACE FUNCTION public.redact_smtp_password()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path TO ''
      AS $$
      BEGIN
        NEW.smtp_password := NULL;
        RETURN NEW;
      END;
      $$;
    $$;

    -- Drop existing trigger if present
    IF EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'tg_redact_smtp_password'
    ) THEN
      EXECUTE 'DROP TRIGGER tg_redact_smtp_password ON public.smtp_settings';
    END IF;

    -- Create trigger to enforce redaction
    EXECUTE 'CREATE TRIGGER tg_redact_smtp_password
             BEFORE INSERT OR UPDATE OF smtp_password ON public.smtp_settings
             FOR EACH ROW EXECUTE FUNCTION public.redact_smtp_password()';

    -- Document deprecation
    EXECUTE $$
      COMMENT ON COLUMN public.smtp_settings.smtp_password IS 
      'Deprecated: Do not store SMTP passwords in the database. Edge Function uses Supabase Secrets instead.'
    $$;
  END IF;
END $$;