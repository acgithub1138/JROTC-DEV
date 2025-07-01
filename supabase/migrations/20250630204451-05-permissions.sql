
-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.process_email_template(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_email_rules() TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_email_queue(INTEGER) TO authenticated;
