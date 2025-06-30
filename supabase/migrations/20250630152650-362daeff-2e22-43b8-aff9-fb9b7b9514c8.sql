
-- First, let's check the actual column names in the tasks table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' AND table_schema = 'public';

-- Let's also check what enum types currently exist
SELECT typname FROM pg_type WHERE typtype = 'e';
