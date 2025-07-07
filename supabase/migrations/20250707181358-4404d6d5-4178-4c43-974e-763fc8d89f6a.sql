-- Create function to get incident category values
CREATE OR REPLACE FUNCTION public.get_incident_category_values()
RETURNS TABLE(value text, label text)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    enumlabel as value,
    INITCAP(REPLACE(enumlabel, '_', ' ')) as label
  FROM pg_enum 
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'incident_category')
  ORDER BY enumsortorder;
$$;