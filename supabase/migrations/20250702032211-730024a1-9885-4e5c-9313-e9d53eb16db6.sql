
-- Create job_board table
CREATE TABLE public.job_board (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cadet_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  reports_to TEXT,
  assistant TEXT,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_job_board_school_id ON public.job_board(school_id);
CREATE INDEX idx_job_board_cadet_id ON public.job_board(cadet_id);
CREATE INDEX idx_job_board_role ON public.job_board(role);

-- Enable RLS
ALTER TABLE public.job_board ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_board
CREATE POLICY "Instructors and command staff can manage job board in their school" 
  ON public.job_board 
  FOR ALL 
  USING (
    school_id = get_current_user_school_id() 
    AND get_current_user_role() = ANY(ARRAY['instructor', 'command_staff', 'admin'])
  )
  WITH CHECK (
    school_id = get_current_user_school_id() 
    AND get_current_user_role() = ANY(ARRAY['instructor', 'command_staff', 'admin'])
  );

CREATE POLICY "Users can view job board from their school" 
  ON public.job_board 
  FOR SELECT 
  USING (school_id = get_current_user_school_id());

-- Add updated_at trigger
CREATE TRIGGER job_board_updated_at
  BEFORE UPDATE ON public.job_board
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
