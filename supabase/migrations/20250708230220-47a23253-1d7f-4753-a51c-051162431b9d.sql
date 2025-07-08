-- Create profile_history table to track changes to cadet profiles
CREATE TABLE public.profile_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES public.profiles(id),
  school_id UUID NOT NULL REFERENCES public.schools(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profile_history
CREATE POLICY "Users can view profile history from their school" 
ON public.profile_history 
FOR SELECT 
USING (school_id = get_current_user_school_id());

CREATE POLICY "System can insert profile history" 
ON public.profile_history 
FOR INSERT 
WITH CHECK (school_id = get_current_user_school_id());

-- Create function to log profile changes
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  change_record RECORD;
  user_id UUID;
BEGIN
  -- Get the current user ID (may be null for system changes)
  user_id := auth.uid();
  
  -- Check first_name changes
  IF OLD.first_name IS DISTINCT FROM NEW.first_name THEN
    INSERT INTO public.profile_history (
      profile_id, field_name, old_value, new_value, changed_by, school_id
    ) VALUES (
      NEW.id, 'first_name', 
      COALESCE(OLD.first_name, 'null'), 
      COALESCE(NEW.first_name, 'null'),
      user_id, NEW.school_id
    );
  END IF;
  
  -- Check last_name changes
  IF OLD.last_name IS DISTINCT FROM NEW.last_name THEN
    INSERT INTO public.profile_history (
      profile_id, field_name, old_value, new_value, changed_by, school_id
    ) VALUES (
      NEW.id, 'last_name', 
      COALESCE(OLD.last_name, 'null'), 
      COALESCE(NEW.last_name, 'null'),
      user_id, NEW.school_id
    );
  END IF;
  
  -- Check email changes
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    INSERT INTO public.profile_history (
      profile_id, field_name, old_value, new_value, changed_by, school_id
    ) VALUES (
      NEW.id, 'email', 
      COALESCE(OLD.email, 'null'), 
      COALESCE(NEW.email, 'null'),
      user_id, NEW.school_id
    );
  END IF;
  
  -- Check role changes
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.profile_history (
      profile_id, field_name, old_value, new_value, changed_by, school_id
    ) VALUES (
      NEW.id, 'role', 
      COALESCE(OLD.role::text, 'null'), 
      COALESCE(NEW.role::text, 'null'),
      user_id, NEW.school_id
    );
  END IF;
  
  -- Check grade changes
  IF OLD.grade IS DISTINCT FROM NEW.grade THEN
    INSERT INTO public.profile_history (
      profile_id, field_name, old_value, new_value, changed_by, school_id
    ) VALUES (
      NEW.id, 'grade', 
      COALESCE(OLD.grade, 'null'), 
      COALESCE(NEW.grade, 'null'),
      user_id, NEW.school_id
    );
  END IF;
  
  -- Check rank changes
  IF OLD.rank IS DISTINCT FROM NEW.rank THEN
    INSERT INTO public.profile_history (
      profile_id, field_name, old_value, new_value, changed_by, school_id
    ) VALUES (
      NEW.id, 'rank', 
      COALESCE(OLD.rank, 'null'), 
      COALESCE(NEW.rank, 'null'),
      user_id, NEW.school_id
    );
  END IF;
  
  -- Check flight changes
  IF OLD.flight IS DISTINCT FROM NEW.flight THEN
    INSERT INTO public.profile_history (
      profile_id, field_name, old_value, new_value, changed_by, school_id
    ) VALUES (
      NEW.id, 'flight', 
      COALESCE(OLD.flight, 'null'), 
      COALESCE(NEW.flight, 'null'),
      user_id, NEW.school_id
    );
  END IF;
  
  -- Check active status changes
  IF OLD.active IS DISTINCT FROM NEW.active THEN
    INSERT INTO public.profile_history (
      profile_id, field_name, old_value, new_value, changed_by, school_id
    ) VALUES (
      NEW.id, 'active', 
      COALESCE(OLD.active::text, 'null'), 
      COALESCE(NEW.active::text, 'null'),
      user_id, NEW.school_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for profile changes
CREATE TRIGGER log_profile_changes_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.log_profile_changes();