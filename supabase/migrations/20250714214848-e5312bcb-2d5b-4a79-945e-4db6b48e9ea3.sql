-- Create the missing generate_incident_number function
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

-- Create the missing generate_subtask_number function  
CREATE OR REPLACE FUNCTION public.generate_subtask_number()
RETURNS text
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT nextval('public.subtask_number_seq') INTO next_num;
    RETURN 'STSK' || LPAD(next_num::TEXT, 5, '0');
END;
$$;