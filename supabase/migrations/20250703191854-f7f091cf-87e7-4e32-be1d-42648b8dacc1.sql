-- Create competition templates table (global templates)
CREATE TABLE public.competition_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  event comp_event_type NOT NULL,
  jrotc_program jrotc_program NOT NULL,
  scores JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on competition_templates
ALTER TABLE public.competition_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for competition_templates (global visibility)
CREATE POLICY "Anyone can view active competition templates" 
ON public.competition_templates 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage competition templates" 
ON public.competition_templates 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Update competitions table with new fields
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS comp_type jrotc_program;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS teams UUID[];
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS cadets UUID[];
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS armed_regulation comp_placement;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS armed_exhibition comp_placement;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS armed_color_guard comp_placement;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS armed_inspection comp_placement;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS unarmed_regulation comp_placement;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS unarmed_exhibition comp_placement;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS unarmed_color_guard comp_placement;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS unarmed_inspection comp_placement;

-- Update competitions RLS policies
DROP POLICY IF EXISTS "Anyone can view competitions" ON public.competitions;

CREATE POLICY "Users can view competitions from their school" 
ON public.competitions 
FOR SELECT 
USING (school_id = get_current_user_school_id());

CREATE POLICY "Instructors can manage competitions in their school" 
ON public.competitions 
FOR ALL 
USING (
  school_id = get_current_user_school_id() 
  AND get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text, 'admin'::text])
)
WITH CHECK (
  school_id = get_current_user_school_id() 
  AND get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text, 'admin'::text])
);

-- Create competition_events table  
CREATE TABLE public.competition_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  event comp_event_type NOT NULL,
  cadet_id UUID NOT NULL REFERENCES public.profiles(id),
  total_points NUMERIC DEFAULT 0,
  score_sheet JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on competition_events
ALTER TABLE public.competition_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for competition_events
CREATE POLICY "Users can view competition events from their school" 
ON public.competition_events 
FOR SELECT 
USING (school_id = get_current_user_school_id());

CREATE POLICY "Instructors can manage competition events in their school" 
ON public.competition_events 
FOR ALL 
USING (
  school_id = get_current_user_school_id() 
  AND get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text, 'admin'::text])
)
WITH CHECK (
  school_id = get_current_user_school_id() 
  AND get_current_user_role() = ANY (ARRAY['instructor'::text, 'command_staff'::text, 'admin'::text])
);

-- Add updated_at triggers
CREATE TRIGGER update_competition_templates_updated_at
BEFORE UPDATE ON public.competition_templates
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_competition_events_updated_at
BEFORE UPDATE ON public.competition_events
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();