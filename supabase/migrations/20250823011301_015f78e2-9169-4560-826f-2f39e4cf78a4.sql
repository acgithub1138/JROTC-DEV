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

-- 3. Enable RLS on the views
ALTER VIEW public.cp_competitions_hosted_view SET (security_barrier = true);
ALTER VIEW public.cp_competitions_public_view SET (security_barrier = true);

-- 4. Create RLS policies for hosted competitions view
CREATE POLICY "cp_competitions_hosted_view: read access"
ON public.cp_competitions_hosted_view
FOR SELECT
USING (
  is_current_user_admin_role() OR 
  (can_user_access('cp_competitions', 'read') AND is_user_in_school(school_id))
);

-- 5. Create RLS policies for public competitions view
CREATE POLICY "cp_competitions_public_view: read access"
ON public.cp_competitions_public_view
FOR SELECT
USING (
  is_current_user_admin_role() OR 
  can_user_access('cp_competitions', 'read')
);