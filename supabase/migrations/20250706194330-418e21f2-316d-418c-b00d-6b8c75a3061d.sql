-- Phase 1: Add new columns to competition_templates table
ALTER TABLE public.competition_templates 
ADD COLUMN is_global boolean NOT NULL DEFAULT false,
ADD COLUMN school_id uuid REFERENCES public.schools(id);

-- Update existing templates to have school_id based on created_by user's school
UPDATE public.competition_templates 
SET school_id = (
  SELECT school_id 
  FROM public.profiles 
  WHERE profiles.id = competition_templates.created_by
)
WHERE created_by IS NOT NULL;

-- Phase 2: Update RLS policies for enhanced template system
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all competition templates" ON public.competition_templates;
DROP POLICY IF EXISTS "Anyone can view active competition templates" ON public.competition_templates;
DROP POLICY IF EXISTS "Instructors can create competition templates" ON public.competition_templates;
DROP POLICY IF EXISTS "Instructors can delete their own templates" ON public.competition_templates;
DROP POLICY IF EXISTS "Instructors can update their own templates" ON public.competition_templates;

-- Create new comprehensive policies

-- 1. Viewing policies
-- Everyone can view active global templates
CREATE POLICY "Anyone can view active global templates" 
ON public.competition_templates 
FOR SELECT 
USING (is_active = true AND is_global = true);

-- Schools can view their own templates
CREATE POLICY "Schools can view their own templates" 
ON public.competition_templates 
FOR SELECT 
USING (is_active = true AND school_id = get_current_user_school_id());

-- 2. Creation policies
-- Admins can create any templates (global or school-specific)
CREATE POLICY "Admins can create any templates" 
ON public.competition_templates 
FOR INSERT 
WITH CHECK (
  get_current_user_role() = 'admin' 
  AND created_by = auth.uid()
);

-- Instructors can create school templates
CREATE POLICY "Instructors can create school templates" 
ON public.competition_templates 
FOR INSERT 
WITH CHECK (
  get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text]) 
  AND created_by = auth.uid()
  AND school_id = get_current_user_school_id()
  AND is_global = false
);

-- 3. Update policies
-- Admins can update any templates
CREATE POLICY "Admins can update any templates" 
ON public.competition_templates 
FOR UPDATE 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Schools can update their own non-global templates
CREATE POLICY "Schools can update their own templates" 
ON public.competition_templates 
FOR UPDATE 
USING (
  get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text]) 
  AND school_id = get_current_user_school_id()
  AND is_global = false
);

-- 4. Delete policies
-- Admins can delete any templates
CREATE POLICY "Admins can delete any templates" 
ON public.competition_templates 
FOR DELETE 
USING (get_current_user_role() = 'admin');

-- Schools can delete their own non-global templates
CREATE POLICY "Schools can delete their own templates" 
ON public.competition_templates 
FOR DELETE 
USING (
  get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text]) 
  AND school_id = get_current_user_school_id()
  AND is_global = false
);