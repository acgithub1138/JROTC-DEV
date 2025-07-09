-- Add missing email trigger for incidents table
CREATE OR REPLACE TRIGGER incidents_email_trigger
  AFTER INSERT OR UPDATE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.process_email_rules();