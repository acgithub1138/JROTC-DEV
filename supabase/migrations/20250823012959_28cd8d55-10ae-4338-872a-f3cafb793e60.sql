-- Drop the incorrectly created views and policies
DROP VIEW IF EXISTS cp_competitions_hosted_view;
DROP VIEW IF EXISTS cp_competitions_public_view;

-- Create the hosted competitions view with proper school filtering
CREATE VIEW cp_competitions_hosted_view AS
SELECT *
FROM public.cp_competitions
WHERE school_id = get_user_school_id_safe();

-- Create the public competitions view with proper filtering
CREATE VIEW cp_competitions_public_view AS
SELECT *
FROM public.cp_competitions
WHERE is_public = true 
  AND status NOT IN ('draft', 'cancelled');