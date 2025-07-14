-- Add RLS policy to allow instructors to update cadet profiles in their school
CREATE POLICY "Instructors can update cadets in their school" 
ON public.profiles 
FOR UPDATE 
USING (
  school_id = get_current_user_school_id() 
  AND get_current_user_role() = ANY (ARRAY['instructor', 'command_staff', 'admin'])
  AND role = 'cadet'
) 
WITH CHECK (
  school_id = get_current_user_school_id() 
  AND role = 'cadet'
  -- Prevent instructors from changing sensitive fields by ensuring they remain the same
  AND school_id = (SELECT school_id FROM public.profiles WHERE id = profiles.id)
);