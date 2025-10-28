-- Set default value for created_by to automatically capture the creating user
ALTER TABLE public.competition_events 
ALTER COLUMN created_by SET DEFAULT auth.uid();