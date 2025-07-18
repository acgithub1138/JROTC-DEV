-- Add recurring event columns to events table
ALTER TABLE public.events 
ADD COLUMN is_recurring BOOLEAN DEFAULT false,
ADD COLUMN recurrence_rule JSONB,
ADD COLUMN recurrence_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN parent_event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- Add index for performance on recurring events
CREATE INDEX idx_events_recurring ON public.events(is_recurring, parent_event_id);
CREATE INDEX idx_events_parent ON public.events(parent_event_id) WHERE parent_event_id IS NOT NULL;

-- Add index for recurrence end date queries
CREATE INDEX idx_events_recurrence_end ON public.events(recurrence_end_date) WHERE recurrence_end_date IS NOT NULL;