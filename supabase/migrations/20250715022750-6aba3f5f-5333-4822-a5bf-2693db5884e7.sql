-- Create competition event types table for dynamic event management
CREATE TABLE public.competition_event_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.competition_event_types ENABLE ROW LEVEL SECURITY;

-- Create policies for competition event types
CREATE POLICY "Everyone can view active event types"
ON public.competition_event_types
FOR SELECT
USING (is_active = true);

CREATE POLICY "Authenticated users can create event types"
ON public.competition_event_types
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can manage all event types"
ON public.competition_event_types
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Add trigger for updated_at
CREATE TRIGGER update_competition_event_types_updated_at
  BEFORE UPDATE ON public.competition_event_types
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default event types from the existing enum
INSERT INTO public.competition_event_types (name, is_default, sort_order) VALUES
  ('Armed Inspection', true, 1),
  ('Armed Color Guard', true, 2),
  ('Armed Exhibition', true, 3),
  ('Armed Dual Exhibition', true, 4),
  ('Armed Regulation', true, 5),
  ('Armed Solo Exhibition', true, 6),
  ('Unarmed Inspection', true, 7),
  ('Unarmed Color Guard', true, 8),
  ('Unarmed Exhibition', true, 9),
  ('Unarmed Dual Exhibition', true, 10),
  ('Unarmed Regulation', true, 11);