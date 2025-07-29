-- Create contact_us table to store contact form submissions
CREATE TABLE public.contact_us (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  school TEXT NOT NULL,
  cadets TEXT,
  message TEXT,
  type TEXT NOT NULL DEFAULT 'demo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contact_us ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_us table
-- Allow anyone to insert contact form submissions (public form)
CREATE POLICY "Anyone can submit contact form" 
ON public.contact_us 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view contact submissions
CREATE POLICY "Admins can view contact submissions" 
ON public.contact_us 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can update contact submissions
CREATE POLICY "Admins can update contact submissions" 
ON public.contact_us 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can delete contact submissions
CREATE POLICY "Admins can delete contact submissions" 
ON public.contact_us 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_contact_us_updated_at
BEFORE UPDATE ON public.contact_us
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();