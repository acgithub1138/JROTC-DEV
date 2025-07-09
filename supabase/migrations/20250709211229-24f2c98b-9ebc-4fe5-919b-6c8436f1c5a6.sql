-- First, let's add incident table columns to schema_tracking if they don't exist
INSERT INTO schema_tracking (table_name, column_name, data_type, is_nullable, column_default, is_active)
SELECT 
  'incidents' as table_name,
  column_name,
  data_type,
  is_nullable::boolean,
  column_default,
  true as is_active
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'incidents'
  AND NOT EXISTS (
    SELECT 1 FROM schema_tracking 
    WHERE table_name = 'incidents' 
    AND column_name = information_schema.columns.column_name
  );

-- Also add any other missing tables that might be useful for email templates
INSERT INTO schema_tracking (table_name, column_name, data_type, is_nullable, column_default, is_active)
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable::boolean,
  column_default,
  true as is_active
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('contacts', 'events', 'budget_transactions')
  AND NOT EXISTS (
    SELECT 1 FROM schema_tracking 
    WHERE table_name = information_schema.columns.table_name
    AND column_name = information_schema.columns.column_name
  );