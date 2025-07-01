
-- Step 1: Add cadet fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS grade TEXT,
ADD COLUMN IF NOT EXISTS rank TEXT,
ADD COLUMN IF NOT EXISTS flight TEXT,
ADD COLUMN IF NOT EXISTS job_role TEXT;

-- Step 2: Migrate existing cadet data to profiles table
UPDATE public.profiles 
SET 
  grade = c.grade,
  rank = c.rank,
  flight = c.flight,
  job_role = c.job_role
FROM public.cadets c
WHERE profiles.id = c.profile_id;

-- Step 3: Update foreign key references in team_members
-- First, update the data to reference profile_id instead of cadet_id
UPDATE public.team_members 
SET cadet_id = c.profile_id
FROM public.cadets c
WHERE team_members.cadet_id = c.id;

-- Step 4: Update foreign key references in inventory_checkout
-- First, update the data to reference profile_id instead of cadet_id
UPDATE public.inventory_checkout 
SET cadet_id = c.profile_id
FROM public.cadets c
WHERE inventory_checkout.cadet_id = c.id;

-- Step 5: Update foreign key references in competition_results
-- First, update the data to reference profile_id instead of cadet_id
UPDATE public.competition_results 
SET cadet_id = c.profile_id
FROM public.cadets c
WHERE competition_results.cadet_id = c.id;

-- Step 6: Drop and recreate foreign key constraints to reference profiles instead of cadets
-- Drop existing foreign key constraints
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_cadet_id_fkey;
ALTER TABLE public.inventory_checkout DROP CONSTRAINT IF EXISTS inventory_checkout_cadet_id_fkey;
ALTER TABLE public.competition_results DROP CONSTRAINT IF EXISTS competition_results_cadet_id_fkey;

-- Create new foreign key constraints referencing profiles
ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_cadet_id_fkey 
FOREIGN KEY (cadet_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.inventory_checkout 
ADD CONSTRAINT inventory_checkout_cadet_id_fkey 
FOREIGN KEY (cadet_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.competition_results 
ADD CONSTRAINT competition_results_cadet_id_fkey 
FOREIGN KEY (cadet_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Step 7: Drop the cadet creation trigger
DROP TRIGGER IF EXISTS handle_cadet_creation_trigger ON public.profiles;

-- Step 8: Drop the cadet creation function
DROP FUNCTION IF EXISTS public.handle_cadet_creation();

-- Step 9: Drop the cadets table
DROP TABLE IF EXISTS public.cadets;

-- Step 10: Update RLS policies to ensure proper access to the new fields
-- The existing RLS policies on profiles should already cover the new fields
-- since they're now part of the profiles table
