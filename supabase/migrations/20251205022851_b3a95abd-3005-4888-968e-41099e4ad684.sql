-- Add preferred_time_request JSONB column to cp_event_registrations table
-- This stores time preferences for basic tier users who cannot select specific slots
-- Structure: { window: "morning" | "midday" | "afternoon", exact_time?: string, notes?: string }

ALTER TABLE public.cp_event_registrations 
ADD COLUMN IF NOT EXISTS preferred_time_request JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.cp_event_registrations.preferred_time_request IS 'Stores preferred time request for basic tier users: {window: morning|midday|afternoon, exact_time?: string, notes?: string}';