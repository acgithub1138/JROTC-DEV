-- Add foreign key constraint for incident_comments user_id
ALTER TABLE public.incident_comments
ADD CONSTRAINT incident_comments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id);