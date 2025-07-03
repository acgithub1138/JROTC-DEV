-- Create enums for contact status and type
CREATE TYPE public.contact_status AS ENUM ('active', 'semi_active', 'not_active');
CREATE TYPE public.contact_type AS ENUM ('parent', 'relative', 'friend');

-- Add new columns to contacts table
ALTER TABLE public.contacts 
ADD COLUMN cadet_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN name TEXT,
ADD COLUMN status contact_status DEFAULT 'active',
ADD COLUMN type contact_type DEFAULT 'parent';

-- Populate the name column from existing first_name and last_name
UPDATE public.contacts 
SET name = CONCAT(first_name, ' ', last_name) 
WHERE first_name IS NOT NULL AND last_name IS NOT NULL;

-- Make name column required after populating it
ALTER TABLE public.contacts 
ALTER COLUMN name SET NOT NULL;

-- Drop the old first_name and last_name columns
ALTER TABLE public.contacts 
DROP COLUMN first_name,
DROP COLUMN last_name;