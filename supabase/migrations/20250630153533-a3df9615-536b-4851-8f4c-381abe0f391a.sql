
-- First, add RLS policies to allow reading task options
ALTER TABLE public.task_status_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_priority_options ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all authenticated users to read active options
CREATE POLICY "Allow authenticated users to read active status options" 
  ON public.task_status_options 
  FOR SELECT 
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Allow authenticated users to read active priority options" 
  ON public.task_priority_options 
  FOR SELECT 
  TO authenticated
  USING (is_active = true);

-- Allow admins to manage status options
CREATE POLICY "Allow admins to manage status options" 
  ON public.task_status_options 
  FOR ALL 
  TO authenticated
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

-- Allow admins to manage priority options
CREATE POLICY "Allow admins to manage priority options" 
  ON public.task_priority_options 
  FOR ALL 
  TO authenticated
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

-- Check if we have the default options, if not, insert them
INSERT INTO public.task_status_options (value, label, color_class, sort_order, is_active)
VALUES 
  ('not_started', 'Not Started', 'bg-gray-100 text-gray-800', 1, true),
  ('working_on_it', 'Working on it', 'bg-blue-100 text-blue-800', 2, true),
  ('stuck', 'Stuck', 'bg-red-100 text-red-800', 3, true),
  ('done', 'Done', 'bg-green-100 text-green-800', 4, true)
ON CONFLICT (value) DO NOTHING;

INSERT INTO public.task_priority_options (value, label, color_class, sort_order, is_active)
VALUES 
  ('low', 'Low', 'bg-green-100 text-green-800', 1, true),
  ('medium', 'Medium', 'bg-yellow-100 text-yellow-800', 2, true),
  ('high', 'High', 'bg-orange-100 text-orange-800', 3, true),
  ('urgent', 'Urgent', 'bg-red-100 text-red-800', 4, true)
ON CONFLICT (value) DO NOTHING;

-- Update the tasks table to use string types instead of enums for now
-- This will allow us to be more flexible with the values
ALTER TABLE public.tasks 
  ALTER COLUMN status TYPE text,
  ALTER COLUMN priority TYPE text;

-- Add constraints to ensure only valid values from the options tables
-- But first, let's create a function to validate these
CREATE OR REPLACE FUNCTION validate_task_status(status_value text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM task_status_options 
    WHERE value = status_value AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_task_priority(priority_value text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM task_priority_options 
    WHERE value = priority_value AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;

-- Add check constraints using the validation functions
ALTER TABLE public.tasks 
  ADD CONSTRAINT tasks_status_valid 
  CHECK (validate_task_status(status));

ALTER TABLE public.tasks 
  ADD CONSTRAINT tasks_priority_valid 
  CHECK (validate_task_priority(priority));

-- Set default values
ALTER TABLE public.tasks 
  ALTER COLUMN status SET DEFAULT 'not_started',
  ALTER COLUMN priority SET DEFAULT 'medium';
