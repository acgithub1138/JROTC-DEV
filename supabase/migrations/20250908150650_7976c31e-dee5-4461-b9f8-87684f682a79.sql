-- Clean up duplicate job board entries and fix connection handling
-- Step 1: Clean up duplicate connections within each job's connections array

-- First, let's create a function to deduplicate connections within a job
CREATE OR REPLACE FUNCTION deduplicate_job_connections()
RETURNS void AS $$
DECLARE
    job_record RECORD;
    cleaned_connections JSONB;
    conn JSONB;
    seen_connections TEXT[];
    connection_key TEXT;
BEGIN
    -- Loop through all jobs that have connections
    FOR job_record IN 
        SELECT id, role, connections 
        FROM job_board 
        WHERE connections IS NOT NULL AND jsonb_array_length(connections) > 0
    LOOP
        cleaned_connections := '[]'::jsonb;
        seen_connections := ARRAY[]::TEXT[];
        
        -- Loop through each connection in the job
        FOR conn IN SELECT * FROM jsonb_array_elements(job_record.connections)
        LOOP
            -- Create a unique key for this connection based on target_role and type
            connection_key := (conn->>'type') || ':' || (conn->>'target_role');
            
            -- Only add if we haven't seen this connection before
            IF NOT (connection_key = ANY(seen_connections)) THEN
                cleaned_connections := cleaned_connections || conn;
                seen_connections := seen_connections || connection_key;
            END IF;
        END LOOP;
        
        -- Update the job with cleaned connections
        UPDATE job_board 
        SET connections = cleaned_connections
        WHERE id = job_record.id;
        
        RAISE NOTICE 'Cleaned connections for job %: % -> %', 
            job_record.role, 
            jsonb_array_length(job_record.connections), 
            jsonb_array_length(cleaned_connections);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the deduplication
SELECT deduplicate_job_connections();

-- Drop the function as it's no longer needed
DROP FUNCTION deduplicate_job_connections();