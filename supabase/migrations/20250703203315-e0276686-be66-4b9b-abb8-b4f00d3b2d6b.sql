-- Add description field to competition_templates table
ALTER TABLE public.competition_templates 
ADD COLUMN description text;