-- Fix malformed handle names in connections by removing duplicate suffixes
UPDATE job_board 
SET connections = (
  SELECT jsonb_agg(
    jsonb_set(
      jsonb_set(
        conn,
        '{source_handle}',
        to_jsonb(
          CASE 
            WHEN conn->>'source_handle' LIKE '%-source-source' THEN 
              regexp_replace(conn->>'source_handle', '-source-source$', '-source')
            WHEN conn->>'source_handle' LIKE '%-target-target' THEN 
              regexp_replace(conn->>'source_handle', '-target-target$', '-target')
            ELSE conn->>'source_handle'
          END
        )
      ),
      '{target_handle}',
      to_jsonb(
        CASE 
          WHEN conn->>'target_handle' LIKE '%-target-target' THEN 
            regexp_replace(conn->>'target_handle', '-target-target$', '-target')
          WHEN conn->>'target_handle' LIKE '%-source-source' THEN 
            regexp_replace(conn->>'target_handle', '-source-source$', '-source')
          ELSE conn->>'target_handle'
        END
      )
    )
  )
  FROM jsonb_array_elements(connections) AS conn
)
WHERE connections IS NOT NULL 
  AND connections != '[]'::jsonb
  AND (
    connections::text LIKE '%source-source%' 
    OR connections::text LIKE '%target-target%'
  );