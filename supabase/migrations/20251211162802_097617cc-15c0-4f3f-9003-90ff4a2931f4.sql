-- Add columns for email-builder-js support
ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS body_json JSONB,
ADD COLUMN IF NOT EXISTS editor_type TEXT DEFAULT 'legacy';

-- Add comment for documentation
COMMENT ON COLUMN public.email_templates.body_json IS 'JSON configuration for email-builder-js templates';
COMMENT ON COLUMN public.email_templates.editor_type IS 'Editor type: legacy (ReactQuill) or builder (email-builder-js)';