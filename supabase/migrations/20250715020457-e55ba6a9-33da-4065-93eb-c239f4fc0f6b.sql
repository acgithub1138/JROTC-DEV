-- Add referred_by and notes fields to schools table
ALTER TABLE public.schools 
ADD COLUMN referred_by TEXT,
ADD COLUMN notes TEXT;