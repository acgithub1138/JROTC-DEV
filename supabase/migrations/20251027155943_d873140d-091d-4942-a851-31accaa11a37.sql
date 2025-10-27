-- Delete all legacy judge data to prepare for new Judges Portal architecture
-- Step 1: Delete all judge assignments (must be first due to foreign key constraints)
DELETE FROM cp_comp_judges;

-- Step 2: Delete all judge records
DELETE FROM cp_judges;

-- Verification comments:
-- After this migration, both tables should have 0 records
-- This removes all POC/test data to prepare for the new independent judge system