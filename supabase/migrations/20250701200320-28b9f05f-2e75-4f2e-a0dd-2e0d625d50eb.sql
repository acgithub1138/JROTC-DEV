
-- Drop unnecessary columns from cadets table
ALTER TABLE public.cadets 
DROP COLUMN IF EXISTS cadet_id,
DROP COLUMN IF EXISTS grade_level,
DROP COLUMN IF EXISTS date_of_birth,
DROP COLUMN IF EXISTS enlistment_date,
DROP COLUMN IF EXISTS graduation_date,
DROP COLUMN IF EXISTS gpa,
DROP COLUMN IF EXISTS attendance_percentage,
DROP COLUMN IF EXISTS parent_name,
DROP COLUMN IF EXISTS parent_email,
DROP COLUMN IF EXISTS parent_phone,
DROP COLUMN IF EXISTS emergency_contact_name,
DROP COLUMN IF EXISTS emergency_contact_phone,
DROP COLUMN IF EXISTS uniform_size,
DROP COLUMN IF EXISTS medical_conditions;

-- Add new columns
ALTER TABLE public.cadets 
ADD COLUMN IF NOT EXISTS grade TEXT,
ADD COLUMN IF NOT EXISTS rank TEXT,
ADD COLUMN IF NOT EXISTS flight TEXT,
ADD COLUMN IF NOT EXISTS job_role TEXT;

-- Update the trigger to create cadet records when users with command_staff or cadet roles are created
CREATE OR REPLACE FUNCTION public.handle_cadet_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create cadet record for command_staff and cadet roles
  IF NEW.role IN ('command_staff', 'cadet') THEN
    INSERT INTO public.cadets (profile_id, school_id)
    VALUES (NEW.id, NEW.school_id)
    ON CONFLICT (profile_id) DO NOTHING; -- Prevent duplicates if cadet record already exists
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for new profiles
DROP TRIGGER IF EXISTS handle_cadet_creation_trigger ON public.profiles;
CREATE TRIGGER handle_cadet_creation_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_cadet_creation();

-- Also handle existing profiles that might need cadet records
INSERT INTO public.cadets (profile_id, school_id)
SELECT id, school_id 
FROM public.profiles 
WHERE role IN ('command_staff', 'cadet')
AND id NOT IN (SELECT profile_id FROM public.cadets)
ON CONFLICT (profile_id) DO NOTHING;
