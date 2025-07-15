-- Create PT Tests table
CREATE TABLE public.pt_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  cadet_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  push_ups INTEGER,
  sit_ups INTEGER,
  plank_time INTEGER, -- time in seconds
  mile_time INTEGER, -- time in seconds
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pt_tests ENABLE ROW LEVEL SECURITY;

-- Create policies for PT Tests
CREATE POLICY "Users can view PT tests from their school"
  ON public.pt_tests
  FOR SELECT
  USING (school_id = get_current_user_school_id());

CREATE POLICY "Instructors can manage PT tests in their school"
  ON public.pt_tests
  FOR ALL
  USING (
    school_id = get_current_user_school_id() 
    AND get_current_user_role() = ANY(ARRAY['instructor', 'command_staff', 'admin'])
  )
  WITH CHECK (
    school_id = get_current_user_school_id() 
    AND get_current_user_role() = ANY(ARRAY['instructor', 'command_staff', 'admin'])
  );

-- Add updated_at trigger
CREATE TRIGGER update_pt_tests_updated_at
  BEFORE UPDATE ON public.pt_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();