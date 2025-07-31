-- Create cp_competitions table for tournament management
CREATE TABLE public.cp_competitions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    max_participants INTEGER,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    registered_schools UUID[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'registration_closed', 'in_progress', 'completed', 'cancelled')),
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID
);

-- Create cp_events table for competition events
CREATE TABLE public.cp_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL,
    competition_id UUID NOT NULL REFERENCES public.cp_competitions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    score_sheet UUID REFERENCES public.competition_templates(id),
    sop TEXT NOT NULL DEFAULT 'text' CHECK (sop IN ('link', 'text')),
    sop_link TEXT,
    sop_text TEXT,
    event_date DATE,
    start_time TIME,
    end_time TIME,
    max_participants INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID
);

-- Add updated_at triggers
CREATE TRIGGER update_cp_competitions_updated_at
    BEFORE UPDATE ON public.cp_competitions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_cp_events_updated_at
    BEFORE UPDATE ON public.cp_events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.cp_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cp_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cp_competitions
CREATE POLICY "Everyone can view public competitions"
    ON public.cp_competitions FOR SELECT
    USING (is_public = true);

CREATE POLICY "Hosting schools can manage their competitions"
    ON public.cp_competitions FOR ALL
    USING (school_id = get_current_user_school_id())
    WITH CHECK (school_id = get_current_user_school_id());

CREATE POLICY "Admins can manage all competitions"
    ON public.cp_competitions FOR ALL
    USING (get_current_user_role() = 'admin')
    WITH CHECK (get_current_user_role() = 'admin');

-- RLS Policies for cp_events
CREATE POLICY "Everyone can view events for public competitions"
    ON public.cp_events FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.cp_competitions 
        WHERE cp_competitions.id = cp_events.competition_id 
        AND cp_competitions.is_public = true
    ));

CREATE POLICY "Hosting schools can manage their events"
    ON public.cp_events FOR ALL
    USING (school_id = get_current_user_school_id())
    WITH CHECK (school_id = get_current_user_school_id());

CREATE POLICY "Admins can manage all events"
    ON public.cp_events FOR ALL
    USING (get_current_user_role() = 'admin')
    WITH CHECK (get_current_user_role() = 'admin');

-- Add indexes for better performance
CREATE INDEX idx_cp_competitions_school_id ON public.cp_competitions(school_id);
CREATE INDEX idx_cp_competitions_status ON public.cp_competitions(status);
CREATE INDEX idx_cp_competitions_start_date ON public.cp_competitions(start_date);
CREATE INDEX idx_cp_events_competition_id ON public.cp_events(competition_id);
CREATE INDEX idx_cp_events_school_id ON public.cp_events(school_id);