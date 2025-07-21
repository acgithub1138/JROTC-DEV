-- Remove user_history table and all related functions/triggers

-- Drop the trigger first
DROP TRIGGER IF EXISTS log_profile_changes ON public.profiles;

-- Drop the functions
DROP FUNCTION IF EXISTS public.log_role_change();
DROP FUNCTION IF EXISTS public.get_user_history(UUID, INTEGER, INTEGER);

-- Drop the indexes
DROP INDEX IF EXISTS idx_user_history_user_id;
DROP INDEX IF EXISTS idx_user_history_created_at;
DROP INDEX IF EXISTS idx_user_history_field_name;

-- Drop the table (this will also drop the RLS policies)
DROP TABLE IF EXISTS public.user_history;