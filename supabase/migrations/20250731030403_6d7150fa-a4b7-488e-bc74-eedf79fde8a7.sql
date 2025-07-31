-- Update RLS policy for job_board_layout_preferences to allow system user for school-wide layouts
DROP POLICY IF EXISTS "Users can manage their own layout preferences in their school" ON public.job_board_layout_preferences;

-- Create new policy that allows both personal and school-wide (system user) layouts
CREATE POLICY "Users can manage layout preferences in their school" 
ON public.job_board_layout_preferences 
FOR ALL 
USING (
  school_id = get_current_user_school_id() AND (
    user_id = auth.uid() OR 
    user_id = '00000000-0000-0000-0000-000000000000'::uuid
  )
)
WITH CHECK (
  school_id = get_current_user_school_id() AND (
    user_id = auth.uid() OR 
    user_id = '00000000-0000-0000-0000-000000000000'::uuid
  )
);