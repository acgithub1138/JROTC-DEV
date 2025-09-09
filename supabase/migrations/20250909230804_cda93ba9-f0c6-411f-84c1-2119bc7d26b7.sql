-- Add registration_source field to cp_comp_schools table
ALTER TABLE public.cp_comp_schools 
ADD COLUMN registration_source text NOT NULL DEFAULT 'internal';

-- Add check constraint to ensure valid values
ALTER TABLE public.cp_comp_schools 
ADD CONSTRAINT cp_comp_schools_registration_source_check 
CHECK (registration_source IN ('internal', 'external'));