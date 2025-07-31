-- Add address fields to cp_competitions table
ALTER TABLE public.cp_competitions 
ADD COLUMN address TEXT,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT,
ADD COLUMN zip TEXT;