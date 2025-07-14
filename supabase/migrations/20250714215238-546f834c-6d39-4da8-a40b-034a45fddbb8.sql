-- Create the missing incident number sequence
CREATE SEQUENCE IF NOT EXISTS incident_number_seq START WITH 1;

-- Verify the function exists and recreate if needed
CREATE OR REPLACE FUNCTION public.generate_incident_number()
RETURNS text
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT nextval('public.incident_number_seq') INTO next_num;
    RETURN 'INC' || LPAD(next_num::TEXT, 5, '0');
END;
$$;