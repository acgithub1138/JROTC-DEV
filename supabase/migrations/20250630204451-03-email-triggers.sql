
-- Create triggers for tables that support email rules
CREATE OR REPLACE TRIGGER tasks_email_trigger
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.process_email_rules();

-- Create triggers for other tables as needed
CREATE OR REPLACE TRIGGER cadets_email_trigger
  AFTER INSERT OR UPDATE ON public.cadets
  FOR EACH ROW
  EXECUTE FUNCTION public.process_email_rules();

CREATE OR REPLACE TRIGGER contacts_email_trigger
  AFTER INSERT OR UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.process_email_rules();

CREATE OR REPLACE TRIGGER expenses_email_trigger
  AFTER INSERT OR UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.process_email_rules();
