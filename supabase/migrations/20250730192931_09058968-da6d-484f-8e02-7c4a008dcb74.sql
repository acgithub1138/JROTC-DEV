-- Add timezone column to schools table
ALTER TABLE public.schools 
ADD COLUMN timezone text DEFAULT 'America/New_York';

-- Add a comment to document the timezone field
COMMENT ON COLUMN public.schools.timezone IS 'School timezone in IANA format (e.g., America/New_York, America/Los_Angeles)';

-- Update existing schools to have a default timezone
UPDATE public.schools 
SET timezone = 'America/New_York' 
WHERE timezone IS NULL;