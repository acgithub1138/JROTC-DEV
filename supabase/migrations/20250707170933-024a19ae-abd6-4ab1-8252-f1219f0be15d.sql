-- Create function to get incident status enum values
CREATE OR REPLACE FUNCTION public.get_incident_status_values()
RETURNS TABLE(value text, label text)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    enumlabel as value,
    INITCAP(REPLACE(enumlabel, '_', ' ')) as label
  FROM pg_enum 
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'incident_status')
  ORDER BY enumsortorder;
$$;