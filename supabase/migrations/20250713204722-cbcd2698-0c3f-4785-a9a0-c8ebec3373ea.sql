-- Delete the existing global SMTP settings record with corrupted encryption
DELETE FROM public.smtp_settings 
WHERE is_global = true AND id = '28b6eaba-06a5-42e3-bba9-8ccc83183a0d';