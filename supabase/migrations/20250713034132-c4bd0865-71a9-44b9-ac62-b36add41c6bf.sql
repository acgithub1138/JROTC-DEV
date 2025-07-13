-- Security Fix: Address Critical Role Escalation Vulnerability
-- Step 1 & 5: Drop overly permissive policy and clean up
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;

-- Step 3: Add database-level role validation function
CREATE OR REPLACE FUNCTION public.validate_role_transition(
  user_id UUID,
  old_role TEXT,
  new_role TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Log the role change attempt
  INSERT INTO public.profile_history (
    profile_id, field_name, old_value, new_value, changed_by, school_id
  ) VALUES (
    user_id, 'role_change_attempt', old_role, new_role, auth.uid(),
    (SELECT school_id FROM public.profiles WHERE id = user_id)
  );
  
  -- Only admins can change roles
  RETURN get_current_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create granular RLS policies for profile updates

-- Policy 1: Users can update their own basic info (excluding role and school_id)
CREATE POLICY "Users can update their own basic info" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() AND
  -- Ensure role and school_id are not being changed
  role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
  school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())
);

-- Policy 2: Users can delete their own profile
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (id = auth.uid());

-- Policy 3: Only admins can update user roles and school assignments
CREATE POLICY "Admins can update any profile including roles" 
ON public.profiles 
FOR UPDATE 
USING (
  get_current_user_role() = 'admin' AND
  -- Validate role transitions through our function
  (
    NEW.role = OLD.role OR 
    validate_role_transition(OLD.id, OLD.role::text, NEW.role::text)
  )
)
WITH CHECK (get_current_user_role() = 'admin');

-- Policy 4: Only admins can delete other users' profiles  
CREATE POLICY "Admins can delete any profile" 
ON public.profiles 
FOR DELETE 
USING (
  get_current_user_role() = 'admin' AND 
  id != auth.uid() -- Prevent admins from accidentally deleting themselves
);

-- Step 3: Add additional validation trigger for role changes
CREATE OR REPLACE FUNCTION public.validate_profile_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is being changed, ensure it's by an admin
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF get_current_user_role() != 'admin' THEN
      RAISE EXCEPTION 'Only administrators can change user roles';
    END IF;
  END IF;
  
  -- If school_id is being changed, ensure it's by an admin
  IF OLD.school_id IS DISTINCT FROM NEW.school_id THEN
    IF get_current_user_role() != 'admin' THEN
      RAISE EXCEPTION 'Only administrators can change user school assignments';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile role validation
DROP TRIGGER IF EXISTS validate_profile_changes ON public.profiles;
CREATE TRIGGER validate_profile_changes
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_role_change();