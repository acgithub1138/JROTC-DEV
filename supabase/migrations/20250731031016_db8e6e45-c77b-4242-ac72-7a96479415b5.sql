-- Remove user_id column from job_board_layout_preferences and simplify for school-wide layouts
ALTER TABLE public.job_board_layout_preferences DROP COLUMN user_id;

-- Add unique constraint on school_id and job_id
ALTER TABLE public.job_board_layout_preferences 
ADD CONSTRAINT job_board_layout_preferences_school_job_unique 
UNIQUE (school_id, job_id);

-- Update RLS policy to only check school access
DROP POLICY IF EXISTS "Users can manage layout preferences in their school" ON public.job_board_layout_preferences;

CREATE POLICY "Users can manage layout preferences in their school" 
ON public.job_board_layout_preferences 
FOR ALL 
USING (school_id = get_current_user_school_id())
WITH CHECK (school_id = get_current_user_school_id());