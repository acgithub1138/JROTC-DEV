-- Add handle preference columns to job_board table for moveable connection points
ALTER TABLE public.job_board 
ADD COLUMN reports_to_source_handle text DEFAULT 'bottom-source',
ADD COLUMN reports_to_target_handle text DEFAULT 'top-target',
ADD COLUMN assistant_source_handle text DEFAULT 'right-source', 
ADD COLUMN assistant_target_handle text DEFAULT 'left-target';