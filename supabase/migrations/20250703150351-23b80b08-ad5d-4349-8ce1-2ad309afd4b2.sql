-- Step 1: Make school_id nullable first
ALTER TABLE public.event_types ALTER COLUMN school_id DROP NOT NULL;

-- Step 2: Clean up existing data BEFORE adding constraints
-- Delete all current default event types (duplicated per school)
DELETE FROM public.event_types WHERE is_default = true;

-- Insert new global default event types
INSERT INTO public.event_types (value, label, school_id, is_default) VALUES
('training', 'Training', NULL, true),
('competition', 'Competition', NULL, true),
('ceremony', 'Ceremony', NULL, true),
('meeting', 'Meeting', NULL, true),
('drill', 'Drill', NULL, true),
('other', 'Other', NULL, true);

-- Step 3: Now add constraints (after data is clean)
-- Constraint 1: If school_id is NULL, then is_default must be TRUE (global defaults)
ALTER TABLE public.event_types ADD CONSTRAINT global_defaults_check 
CHECK ((school_id IS NULL AND is_default = true) OR school_id IS NOT NULL);

-- Constraint 2: If is_default is TRUE, then school_id must be NULL (defaults are global)
ALTER TABLE public.event_types ADD CONSTRAINT default_types_global_check 
CHECK ((is_default = true AND school_id IS NULL) OR is_default = false);

-- Step 4: Update RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view event types from their school" ON public.event_types;
DROP POLICY IF EXISTS "Instructors can manage event types in their school" ON public.event_types;

-- Create new policies for global + school-specific access
CREATE POLICY "Users can view global and school event types" 
ON public.event_types 
FOR SELECT 
USING (school_id IS NULL OR school_id = get_current_user_school_id());

-- Policy for creating school-specific custom types
CREATE POLICY "Instructors can create custom event types for their school" 
ON public.event_types 
FOR INSERT 
WITH CHECK (
  school_id = get_current_user_school_id() 
  AND is_default = false
  AND get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text, 'admin'::text])
);

-- Policy for updating/deleting only school-specific custom types (not global defaults)
CREATE POLICY "Instructors can manage custom event types in their school" 
ON public.event_types 
FOR UPDATE 
USING (
  school_id = get_current_user_school_id() 
  AND is_default = false
  AND get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text, 'admin'::text])
);

CREATE POLICY "Instructors can delete custom event types in their school" 
ON public.event_types 
FOR DELETE 
USING (
  school_id = get_current_user_school_id() 
  AND is_default = false
  AND get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text, 'admin'::text])
);