-- Create cp_judges table
CREATE TABLE public.cp_judges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.cp_judges ENABLE ROW LEVEL SECURITY;

-- Create policies for cp_judges
CREATE POLICY "Hosting schools can manage their judges" 
ON public.cp_judges 
FOR ALL 
USING (school_id = get_current_user_school_id())
WITH CHECK (school_id = get_current_user_school_id());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cp_judges_updated_at
BEFORE UPDATE ON public.cp_judges
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();