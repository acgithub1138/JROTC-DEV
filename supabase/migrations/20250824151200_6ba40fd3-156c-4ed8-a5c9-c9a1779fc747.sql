-- Add missing foreign key constraints to announcements table
ALTER TABLE public.announcements 
ADD CONSTRAINT announcements_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.announcements 
ADD CONSTRAINT announcements_school_id_fkey 
FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;