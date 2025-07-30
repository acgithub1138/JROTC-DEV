-- Remove legacy handle columns from job_board table
-- These columns are no longer needed as we've migrated to the connections JSONB field

ALTER TABLE job_board 
DROP COLUMN IF EXISTS reports_to_source_handle,
DROP COLUMN IF EXISTS reports_to_target_handle,
DROP COLUMN IF EXISTS assistant_source_handle,
DROP COLUMN IF EXISTS assistant_target_handle;