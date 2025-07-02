
-- Add active column to profiles table with default value of true
ALTER TABLE public.profiles 
ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;

-- Update any existing records to ensure they have active = true
UPDATE public.profiles 
SET active = true 
WHERE active IS NULL;
