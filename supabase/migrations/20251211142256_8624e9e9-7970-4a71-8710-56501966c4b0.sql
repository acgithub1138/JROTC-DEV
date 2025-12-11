-- Function to get table columns with their foreign key relationships
CREATE OR REPLACE FUNCTION public.get_table_columns_with_relations(source_table text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable boolean,
  referenced_table text,
  referenced_column text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text,
    c.data_type::text,
    (c.is_nullable = 'YES')::boolean,
    ccu.table_name::text as referenced_table,
    ccu.column_name::text as referenced_column
  FROM information_schema.columns c
  LEFT JOIN information_schema.key_column_usage kcu 
    ON c.table_schema = kcu.table_schema 
    AND c.table_name = kcu.table_name 
    AND c.column_name = kcu.column_name
  LEFT JOIN information_schema.table_constraints tc 
    ON kcu.constraint_name = tc.constraint_name 
    AND kcu.table_schema = tc.table_schema
    AND tc.constraint_type = 'FOREIGN KEY'
  LEFT JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name 
    AND tc.table_schema = ccu.table_schema
  WHERE c.table_schema = 'public'
    AND c.table_name = source_table
  ORDER BY c.ordinal_position;
END;
$$;

-- Function to get all available email source tables from schema_tracking
CREATE OR REPLACE FUNCTION public.get_email_source_tables()
RETURNS TABLE (
  table_name text,
  display_label text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT 
    st.table_name::text,
    INITCAP(REPLACE(st.table_name, '_', ' '))::text as display_label
  FROM public.schema_tracking st
  WHERE st.table_name IS NOT NULL
  ORDER BY st.table_name;
END;
$$;