-- Add ccc_portal field to schools table
ALTER TABLE public.schools
ADD COLUMN ccc_portal boolean DEFAULT false;