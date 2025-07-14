-- Fix the generate_task_number function to access the sequence properly
CREATE OR REPLACE FUNCTION public.generate_task_number()
RETURNS text
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT nextval('public.task_number_seq') INTO next_num;
    RETURN 'TSK' || LPAD(next_num::TEXT, 5, '0');
END;
$$;