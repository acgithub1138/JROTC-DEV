-- Create unique constraint for role names within each school
ALTER TABLE job_board 
ADD CONSTRAINT unique_role_per_school 
UNIQUE (school_id, role);

-- Create an index to improve performance for role uniqueness checks
CREATE INDEX IF NOT EXISTS idx_job_board_school_role ON job_board(school_id, role);