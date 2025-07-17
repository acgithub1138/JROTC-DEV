-- Restore email rule triggers for tasks and subtasks tables

-- Create trigger for tasks table - INSERT operations
CREATE OR REPLACE TRIGGER tasks_process_email_rules_insert_trigger
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.process_email_rules();

-- Create trigger for tasks table - UPDATE operations  
CREATE OR REPLACE TRIGGER tasks_process_email_rules_update_trigger
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.process_email_rules();

-- Create trigger for subtasks table - INSERT operations
CREATE OR REPLACE TRIGGER subtasks_process_email_rules_insert_trigger
  AFTER INSERT ON public.subtasks
  FOR EACH ROW
  EXECUTE FUNCTION public.process_email_rules();

-- Create trigger for subtasks table - UPDATE operations
CREATE OR REPLACE TRIGGER subtasks_process_email_rules_update_trigger
  AFTER UPDATE ON public.subtasks
  FOR EACH ROW
  EXECUTE FUNCTION public.process_email_rules();