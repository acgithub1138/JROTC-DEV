-- Add status field to competitions table
ALTER TABLE public.competitions 
ADD COLUMN status text DEFAULT 'active';

-- Add check constraint for valid status values
ALTER TABLE public.competitions 
ADD CONSTRAINT competitions_status_check 
CHECK (status IN ('active', 'cancelled', 'completed', 'draft'));