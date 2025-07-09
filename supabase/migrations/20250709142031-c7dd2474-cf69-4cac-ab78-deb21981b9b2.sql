-- Create user_sidebar_preferences table for storing column preferences
CREATE TABLE public.user_sidebar_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competitions_columns TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_sidebar_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own sidebar preferences" 
ON public.user_sidebar_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sidebar preferences" 
ON public.user_sidebar_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sidebar preferences" 
ON public.user_sidebar_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sidebar preferences" 
ON public.user_sidebar_preferences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_sidebar_preferences_updated_at
BEFORE UPDATE ON public.user_sidebar_preferences
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();