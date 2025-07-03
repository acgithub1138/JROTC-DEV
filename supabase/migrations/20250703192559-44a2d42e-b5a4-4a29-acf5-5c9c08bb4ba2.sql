-- Update RLS policies for competition_templates to allow instructors to manage their own templates

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage competition templates" ON public.competition_templates;

-- Create new policies
-- Admins can manage all templates
CREATE POLICY "Admins can manage all competition templates" 
ON public.competition_templates 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Instructors can create templates
CREATE POLICY "Instructors can create competition templates" 
ON public.competition_templates 
FOR INSERT 
WITH CHECK (
  get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text]) 
  AND created_by = auth.uid()
);

-- Instructors can update their own templates
CREATE POLICY "Instructors can update their own templates" 
ON public.competition_templates 
FOR UPDATE 
USING (
  get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text]) 
  AND created_by = auth.uid()
);

-- Instructors can delete their own templates
CREATE POLICY "Instructors can delete their own templates" 
ON public.competition_templates 
FOR DELETE 
USING (
  get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text]) 
  AND created_by = auth.uid()
);