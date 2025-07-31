-- First drop the existing policy that depends on user_id
DROP POLICY IF EXISTS "Users can manage layout preferences in their school" ON public.job_board_layout_preferences;

-- Remove user_id column from job_board_layout_preferences
ALTER TABLE public.job_board_layout_preferences DROP COLUMN user_id;

-- Add unique constraint on school_id and job_id
ALTER TABLE public.job_board_layout_preferences 
ADD CONSTRAINT job_board_layout_preferences_school_job_unique 
UNIQUE (school_id, job_id);

-- Create simplified RLS policy for school-wide layouts
CREATE POLICY "Users can manage layout preferences in their school" 
ON public.job_board_layout_preferences 
FOR ALL 
USING (school_id = get_current_user_school_id())
WITH CHECK (school_id = get_current_user_school_id());