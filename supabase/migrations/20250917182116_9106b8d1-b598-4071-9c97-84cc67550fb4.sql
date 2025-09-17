-- Fix the competition registration template to be properly global
UPDATE public.email_templates 
SET is_global = true, school_id = NULL
WHERE source_table = 'cp_comp_schools' 
  AND name ILIKE '%comp%registration%confirmation%'
  AND is_active = true;