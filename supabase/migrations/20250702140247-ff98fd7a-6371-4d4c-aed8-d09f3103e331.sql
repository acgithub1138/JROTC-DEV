-- Create job_board_layout_preferences table for storing user-specific node positions
CREATE TABLE public.job_board_layout_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.job_board(id) ON DELETE CASCADE,
  position_x NUMERIC NOT NULL,
  position_y NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- Add indexes for performance
CREATE INDEX idx_job_board_layout_preferences_user_id ON public.job_board_layout_preferences(user_id);
CREATE INDEX idx_job_board_layout_preferences_school_id ON public.job_board_layout_preferences(school_id);
CREATE INDEX idx_job_board_layout_preferences_job_id ON public.job_board_layout_preferences(job_id);

-- Enable RLS
ALTER TABLE public.job_board_layout_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own layout preferences in their school" 
  ON public.job_board_layout_preferences 
  FOR ALL 
  USING (
    user_id = auth.uid() 
    AND school_id = get_current_user_school_id()
  )
  WITH CHECK (
    user_id = auth.uid() 
    AND school_id = get_current_user_school_id()
  );

-- Add updated_at trigger
CREATE TRIGGER job_board_layout_preferences_updated_at
  BEFORE UPDATE ON public.job_board_layout_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();