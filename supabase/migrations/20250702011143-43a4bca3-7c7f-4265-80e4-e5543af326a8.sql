
-- Step 1: Drop unused tables and clean up database
DROP TABLE IF EXISTS public.ranks CASCADE;
DROP TABLE IF EXISTS public.job_board_roles CASCADE;

-- Step 2: Remove job_role column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS job_role;

-- Step 3: Drop any indexes that were created for the dropped tables
DROP INDEX IF EXISTS idx_ranks_program;
DROP INDEX IF EXISTS idx_job_board_roles_program;
DROP INDEX IF EXISTS idx_profiles_rank;
DROP INDEX IF EXISTS idx_profiles_job_role;
