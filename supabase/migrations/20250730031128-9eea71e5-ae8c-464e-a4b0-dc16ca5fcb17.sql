-- Add connections JSON field to job_board table
ALTER TABLE public.job_board 
ADD COLUMN connections JSONB DEFAULT '[]'::jsonb;

-- Create an index for better performance on connections queries
CREATE INDEX idx_job_board_connections ON public.job_board USING GIN(connections);

-- Function to migrate existing connections to the new format
CREATE OR REPLACE FUNCTION migrate_job_board_connections()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    job_record RECORD;
    connections_array JSONB := '[]'::jsonb;
    connection_obj JSONB;
BEGIN
    -- Loop through all job board records
    FOR job_record IN 
        SELECT id, role, reports_to, assistant, 
               reports_to_source_handle, reports_to_target_handle,
               assistant_source_handle, assistant_target_handle
        FROM public.job_board 
    LOOP
        connections_array := '[]'::jsonb;
        
        -- Add reports_to connection if it exists
        IF job_record.reports_to IS NOT NULL THEN
            connection_obj := jsonb_build_object(
                'id', gen_random_uuid(),
                'type', 'reports_to',
                'target_role', job_record.reports_to,
                'source_handle', COALESCE(job_record.reports_to_source_handle, 'bottom-source'),
                'target_handle', COALESCE(job_record.reports_to_target_handle, 'top-target')
            );
            connections_array := connections_array || connection_obj;
        END IF;
        
        -- Add assistant connection if it exists
        IF job_record.assistant IS NOT NULL THEN
            connection_obj := jsonb_build_object(
                'id', gen_random_uuid(),
                'type', 'assistant',
                'target_role', job_record.assistant,
                'source_handle', COALESCE(job_record.assistant_source_handle, 'right-source'),
                'target_handle', COALESCE(job_record.assistant_target_handle, 'left-target')
            );
            connections_array := connections_array || connection_obj;
        END IF;
        
        -- Update the job with the new connections array
        UPDATE public.job_board 
        SET connections = connections_array 
        WHERE id = job_record.id;
    END LOOP;
END;
$$;

-- Run the migration
SELECT migrate_job_board_connections();

-- Drop the migration function as it's no longer needed
DROP FUNCTION migrate_job_board_connections();