-- Create database views for competition portal with enhanced filtering

-- 1. Create hosted competitions view (shows all competitions from user's school)
CREATE VIEW public.cp_competitions_hosted_view AS
SELECT *
FROM public.cp_competitions
WHERE school_id IS NOT NULL;

-- 2. Create public competitions view (shows only public competitions that are not draft or cancelled)
CREATE VIEW public.cp_competitions_public_view AS
SELECT *
FROM public.cp_competitions
WHERE is_public = true
  AND status NOT IN ('draft', 'cancelled');

-- Views inherit RLS from the underlying table (cp_competitions)
-- No additional RLS policies needed on the views themselves