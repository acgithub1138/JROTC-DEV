-- Add missing foreign key constraints for incident_comments table

-- Add foreign key constraint linking user_id to profiles table
ALTER TABLE public.incident_comments
ADD CONSTRAINT incident_comments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- Add foreign key constraint linking incident_id to incidents table  
ALTER TABLE public.incident_comments
ADD CONSTRAINT incident_comments_incident_id_fkey
FOREIGN KEY (incident_id) REFERENCES public.incidents(id) ON DELETE CASCADE;