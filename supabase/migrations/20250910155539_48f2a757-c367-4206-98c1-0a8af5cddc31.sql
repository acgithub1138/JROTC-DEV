-- Add temp_pswd column to profiles table for temporary password storage
ALTER TABLE public.profiles ADD COLUMN temp_pswd text;