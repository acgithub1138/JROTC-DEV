-- Create cp_comp_schools table
CREATE TABLE public.cp_comp_schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.cp_competitions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'canceled', 'no_show')),
  resource UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(school_id, competition_id)
);

-- Create cp_comp_events table  
CREATE TABLE public.cp_comp_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.cp_competitions(id) ON DELETE CASCADE,
  event UUID REFERENCES public.cp_events(id),
  judges UUID[] DEFAULT '{}',
  resources UUID[] DEFAULT '{}',
  schools UUID[] DEFAULT '{}',
  location TEXT,
  max_participants INTEGER,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  sop TEXT CHECK (sop IN ('link', 'text')),
  sop_link TEXT,
  sop_text TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create cp_comp_resources table
CREATE TABLE public.cp_comp_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.cp_competitions(id) ON DELETE CASCADE,
  resource UUID NOT NULL REFERENCES public.profiles(id),
  location TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  assignment_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on all three tables
ALTER TABLE public.cp_comp_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cp_comp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cp_comp_resources ENABLE ROW LEVEL SECURITY;

-- RLS policies for cp_comp_schools
CREATE POLICY "Hosting schools can manage their comp schools"
ON public.cp_comp_schools
FOR ALL
USING (school_id = get_current_user_school_id())
WITH CHECK (school_id = get_current_user_school_id());

CREATE POLICY "Admins can manage all comp schools"
ON public.cp_comp_schools
FOR ALL
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- RLS policies for cp_comp_events
CREATE POLICY "Hosting schools can manage their comp events"
ON public.cp_comp_events
FOR ALL
USING (school_id = get_current_user_school_id())
WITH CHECK (school_id = get_current_user_school_id());

CREATE POLICY "Admins can manage all comp events"
ON public.cp_comp_events
FOR ALL
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- RLS policies for cp_comp_resources
CREATE POLICY "Hosting schools can manage their comp resources"
ON public.cp_comp_resources
FOR ALL
USING (school_id = get_current_user_school_id())
WITH CHECK (school_id = get_current_user_school_id());

CREATE POLICY "Admins can manage all comp resources"
ON public.cp_comp_resources
FOR ALL
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Add updated_at triggers
CREATE TRIGGER update_cp_comp_schools_updated_at
BEFORE UPDATE ON public.cp_comp_schools
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_cp_comp_events_updated_at
BEFORE UPDATE ON public.cp_comp_events
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_cp_comp_resources_updated_at
BEFORE UPDATE ON public.cp_comp_resources
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();