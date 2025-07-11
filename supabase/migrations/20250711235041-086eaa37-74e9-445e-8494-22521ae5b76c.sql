-- Add category column to incidents table
ALTER TABLE public.incidents ADD COLUMN category TEXT NOT NULL DEFAULT 'issue';

-- Create incident category options table
CREATE TABLE public.incident_category_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  color_class TEXT NOT NULL DEFAULT 'bg-gray-100 text-gray-800',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default incident category options
INSERT INTO public.incident_category_options (value, label, color_class, sort_order) VALUES
('issue', 'Issue', 'bg-red-100 text-red-800', 1),
('request', 'Request', 'bg-blue-100 text-blue-800', 2),
('enhancement', 'Enhancement', 'bg-green-100 text-green-800', 3),
('maintenance', 'Maintenance', 'bg-yellow-100 text-yellow-800', 4);

-- Add trigger for updating updated_at timestamp
CREATE TRIGGER handle_updated_at_incident_category_options
    BEFORE UPDATE ON public.incident_category_options
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Enable RLS on incident_category_options table
ALTER TABLE public.incident_category_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for incident_category_options (same as other options tables)
CREATE POLICY "Everyone can view incident category options" 
ON public.incident_category_options 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Only admins can manage incident category options" 
ON public.incident_category_options 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Create validation function
CREATE OR REPLACE FUNCTION public.validate_incident_category(category_value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM incident_category_options 
    WHERE value = category_value AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;