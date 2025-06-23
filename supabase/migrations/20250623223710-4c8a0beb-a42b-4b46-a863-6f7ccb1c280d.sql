
-- Add task_number column to the tasks table
ALTER TABLE tasks ADD COLUMN task_number TEXT;

-- Create a sequence for auto-incrementing task numbers
CREATE SEQUENCE task_number_seq START WITH 1;

-- Create a function to generate task numbers with TSK prefix and zero padding
CREATE OR REPLACE FUNCTION generate_task_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT nextval('task_number_seq') INTO next_num;
    RETURN 'TSK' || LPAD(next_num::TEXT, 5, '0');
END;
$$;

-- Create a trigger function to automatically assign task numbers
CREATE OR REPLACE FUNCTION assign_task_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.task_number IS NULL THEN
        NEW.task_number := generate_task_number();
    END IF;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER task_number_trigger
    BEFORE INSERT ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION assign_task_number();

-- Update existing tasks to have task numbers (ordered by created_at)
WITH numbered_tasks AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
    FROM tasks
    WHERE task_number IS NULL
)
UPDATE tasks 
SET task_number = 'TSK' || LPAD(numbered_tasks.row_num::TEXT, 5, '0')
FROM numbered_tasks
WHERE tasks.id = numbered_tasks.id;

-- Update the sequence to continue from where we left off
SELECT setval('task_number_seq', (SELECT COUNT(*) FROM tasks));
