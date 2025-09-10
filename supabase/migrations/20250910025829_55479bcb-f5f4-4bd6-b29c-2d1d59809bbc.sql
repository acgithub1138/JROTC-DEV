-- Fix Bob's role to special_staff
UPDATE profiles 
SET role_id = '11ea82b2-9ed2-4d7d-b334-0e4bc5611071'
WHERE id = '5400190f-9d88-4e59-9be1-7f2d47185800';

-- Optional: Drop the deprecated role column from profiles table
-- Uncomment the line below to remove the role column entirely
-- ALTER TABLE profiles DROP COLUMN IF EXISTS role;