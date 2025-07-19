-- Add tier field to job_board table
ALTER TABLE public.job_board 
ADD COLUMN tier integer DEFAULT 1;

-- Add a comment to document the purpose of this field
COMMENT ON COLUMN public.job_board.tier IS 'Hierarchical tier level for organizing the chain of command chart';