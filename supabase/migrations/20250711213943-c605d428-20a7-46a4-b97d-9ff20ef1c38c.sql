-- Remove ALL RLS policies for incidents and incident_comments
DROP POLICY IF EXISTS "Incident visibility" ON public.incidents;
DROP POLICY IF EXISTS "Instructors can create incidents" ON public.incidents;
DROP POLICY IF EXISTS "Incident updates" ON public.incidents;
DROP POLICY IF EXISTS "Admins can delete incidents" ON public.incidents;

DROP POLICY IF EXISTS "Comment visibility" ON public.incident_comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.incident_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.incident_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.incident_comments;

-- Disable RLS entirely on both tables
ALTER TABLE public.incidents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_comments DISABLE ROW LEVEL SECURITY;