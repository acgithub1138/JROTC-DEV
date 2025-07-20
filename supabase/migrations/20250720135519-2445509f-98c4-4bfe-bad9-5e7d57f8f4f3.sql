
-- Step 1: Make school_id nullable to support global themes
ALTER TABLE public.themes ALTER COLUMN school_id DROP NOT NULL;

-- Step 2: Update existing themes to be global (set school_id to NULL)
UPDATE public.themes SET school_id = NULL WHERE school_id IS NOT NULL;

-- Step 3: Update RLS policies to handle global themes
-- Drop existing policies
DROP POLICY IF EXISTS "Only admins can manage themes" ON public.themes;
DROP POLICY IF EXISTS "Users can view themes from their school" ON public.themes;

-- Create new policies for global themes
CREATE POLICY "Admins can manage all themes"
  ON public.themes
  FOR ALL
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Everyone can view active global themes"
  ON public.themes
  FOR SELECT
  USING (is_active = true AND school_id IS NULL);

-- Optional: Allow school-specific themes if needed in the future
CREATE POLICY "Schools can view their own themes"
  ON public.themes
  FOR SELECT
  USING (school_id = get_current_user_school_id() AND is_active = true);

CREATE POLICY "Instructors can manage school-specific themes"
  ON public.themes
  FOR ALL
  USING (
    school_id = get_current_user_school_id() 
    AND get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text, 'admin'::text])
  )
  WITH CHECK (
    school_id = get_current_user_school_id() 
    AND get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text, 'admin'::text])
  );
