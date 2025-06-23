
-- First, drop all existing RLS policies that depend on school_id
DROP POLICY IF EXISTS "Users can view status options for their school" ON public.task_status_options;
DROP POLICY IF EXISTS "Instructors and command_staff can manage status options" ON public.task_status_options;
DROP POLICY IF EXISTS "Users can view priority options for their school" ON public.task_priority_options;
DROP POLICY IF EXISTS "Instructors and command_staff can manage priority options" ON public.task_priority_options;

-- Clean up the task_status_options table
-- Keep only one record for each unique value
DELETE FROM public.task_status_options 
WHERE id NOT IN (
  SELECT DISTINCT ON (value) id 
  FROM public.task_status_options 
  ORDER BY value, created_at
);

-- Remove the school_id column and update the unique constraint
ALTER TABLE public.task_status_options 
DROP COLUMN school_id,
DROP CONSTRAINT IF EXISTS task_status_options_school_id_value_key,
ADD CONSTRAINT task_status_options_value_key UNIQUE (value);

-- Clean up the task_priority_options table
-- Keep only one record for each unique value
DELETE FROM public.task_priority_options 
WHERE id NOT IN (
  SELECT DISTINCT ON (value) id 
  FROM public.task_priority_options 
  ORDER BY value, created_at
);

-- Remove the school_id column and update the unique constraint
ALTER TABLE public.task_priority_options 
DROP COLUMN school_id,
DROP CONSTRAINT IF EXISTS task_priority_options_school_id_value_key,
ADD CONSTRAINT task_priority_options_value_key UNIQUE (value);

-- Create new RLS policies for global access
-- Status options - everyone can view, only admins can manage
CREATE POLICY "Everyone can view status options" ON public.task_status_options
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage status options" ON public.task_status_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Priority options - everyone can view, only admins can manage
CREATE POLICY "Everyone can view priority options" ON public.task_priority_options
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage priority options" ON public.task_priority_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
