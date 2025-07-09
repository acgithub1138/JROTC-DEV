-- Add competitions_columns column to user_sidebar_preferences table
ALTER TABLE public.user_sidebar_preferences 
ADD COLUMN IF NOT EXISTS competitions_columns TEXT[];