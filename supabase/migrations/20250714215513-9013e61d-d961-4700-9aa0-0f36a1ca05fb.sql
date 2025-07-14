-- Grant USAGE permissions on sequences to fix API access issues
GRANT USAGE ON SEQUENCE public.incident_number_seq TO authenticator, anon, authenticated;
GRANT USAGE ON SEQUENCE public.task_number_seq TO authenticator, anon, authenticated;
GRANT USAGE ON SEQUENCE public.subtask_number_seq TO authenticator, anon, authenticated;

-- Also grant USAGE on all sequences in the public schema for future sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticator, anon, authenticated;