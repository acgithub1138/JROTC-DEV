-- Create competition_events_history table for tracking score sheet changes
CREATE TABLE public.competition_events_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_event_id UUID NOT NULL REFERENCES public.competition_events(id) ON DELETE CASCADE,
  school_id UUID NOT NULL,
  changed_by UUID NOT NULL,
  change_reason TEXT NOT NULL,
  old_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  new_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.competition_events_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for competition_events_history
CREATE POLICY "competition_events_history: read access" 
ON public.competition_events_history 
FOR SELECT 
USING (is_current_user_admin_role() OR (can_user_access('cp_comp_results'::text, 'read'::text) AND is_user_in_school(school_id)));

CREATE POLICY "competition_events_history: insert only" 
ON public.competition_events_history 
FOR INSERT 
WITH CHECK (is_current_user_admin_role() OR (can_user_access('cp_comp_results'::text, 'update'::text) AND is_user_in_school(school_id) AND changed_by = auth.uid()));

-- Add index for better performance
CREATE INDEX idx_competition_events_history_event_id ON public.competition_events_history(competition_event_id);
CREATE INDEX idx_competition_events_history_created_at ON public.competition_events_history(created_at);