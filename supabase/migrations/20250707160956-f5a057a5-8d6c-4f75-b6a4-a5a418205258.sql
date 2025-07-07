-- Add foreign key constraints for profiles
ALTER TABLE public.incidents
ADD CONSTRAINT incidents_submitted_by_fkey
FOREIGN KEY (submitted_by) REFERENCES public.profiles(id);

ALTER TABLE public.incidents
ADD CONSTRAINT incidents_assigned_to_fkey
FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);