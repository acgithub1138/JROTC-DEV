
-- Enable RLS on schools table if not already enabled
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their school" ON public.schools;
DROP POLICY IF EXISTS "Users can update their school" ON public.schools;
DROP POLICY IF EXISTS "Users can view schools based on role" ON public.schools;
DROP POLICY IF EXISTS "Users can update schools based on role" ON public.schools;
DROP POLICY IF EXISTS "Users can insert schools based on role" ON public.schools;
DROP POLICY IF EXISTS "Users can delete schools based on role" ON public.schools;

-- Policy for viewing schools (SELECT)
CREATE POLICY "Users can view schools based on role" 
  ON public.schools
  FOR SELECT 
  USING (
    -- Admins can see all schools
    public.get_current_user_role() = 'admin'
    OR 
    -- Other users can see their own school
    id = public.get_current_user_school_id()
  );

-- Policy for creating schools (INSERT)
CREATE POLICY "Users can insert schools based on role" 
  ON public.schools
  FOR INSERT 
  WITH CHECK (
    -- Only admins can create schools
    public.get_current_user_role() = 'admin'
  );

-- Policy for updating schools (UPDATE)
CREATE POLICY "Users can update schools based on role" 
  ON public.schools
  FOR UPDATE 
  USING (
    -- Only admins can update schools
    public.get_current_user_role() = 'admin'
  );

-- Policy for deleting schools (DELETE)
CREATE POLICY "Users can delete schools based on role" 
  ON public.schools
  FOR DELETE 
  USING (
    -- Only admins can delete schools
    public.get_current_user_role() = 'admin'
  );
