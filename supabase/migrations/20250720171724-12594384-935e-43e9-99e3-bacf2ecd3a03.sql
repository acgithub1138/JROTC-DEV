-- Add new theme fields for sidebar link styling
ALTER TABLE public.themes 
ADD COLUMN link_text TEXT DEFAULT '#d1d5db',
ADD COLUMN link_selected_text TEXT DEFAULT '#ffffff', 
ADD COLUMN link_hover TEXT DEFAULT '#1f2937';