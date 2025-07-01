
-- Add composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ranks_program ON ranks(program);
CREATE INDEX IF NOT EXISTS idx_job_board_roles_program ON job_board_roles(program);

-- Add indexes on profiles table for rank and job_role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_rank ON profiles(rank) WHERE rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_job_role ON profiles(job_role) WHERE job_role IS NOT NULL;

-- Note: We're not adding foreign key constraints between profiles and ranks/job_board_roles
-- because they reference different columns (profiles stores text values, while ranks/job_board_roles 
-- are filtered by program). This would require a more complex schema change.
-- Instead, we'll handle validation in the application layer.
