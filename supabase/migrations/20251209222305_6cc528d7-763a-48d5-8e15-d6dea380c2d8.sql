-- Add max_points, weight, and required columns to cp_comp_events
ALTER TABLE public.cp_comp_events
ADD COLUMN max_points numeric DEFAULT 0,
ADD COLUMN weight numeric DEFAULT 1,
ADD COLUMN required boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.cp_comp_events.max_points IS 'Auto-calculated: score template max points × judges_needed';
COMMENT ON COLUMN public.cp_comp_events.weight IS 'Weight multiplier for normalized scoring';
COMMENT ON COLUMN public.cp_comp_events.required IS 'Whether this event is required for competition participation';