
-- Drop existing policies and recreate them to ensure they're correct
DROP POLICY IF EXISTS "Users can view their own sidebar preferences" ON public.user_sidebar_preferences;
DROP POLICY IF EXISTS "Users can insert their own sidebar preferences" ON public.user_sidebar_preferences;
DROP POLICY IF EXISTS "Users can update their own sidebar preferences" ON public.user_sidebar_preferences;
DROP POLICY IF EXISTS "Users can delete their own sidebar preferences" ON public.user_sidebar_preferences;

-- Recreate the policies
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
