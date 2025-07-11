-- Add role_management_columns column to user_sidebar_preferences table
ALTER TABLE public.user_sidebar_preferences 
ADD COLUMN IF NOT EXISTS role_management_columns TEXT[];