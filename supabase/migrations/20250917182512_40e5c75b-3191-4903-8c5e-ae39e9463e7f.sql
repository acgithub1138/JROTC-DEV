-- Ensure competition registration confirmation email trigger exists
-- 1) Drop existing trigger if present for idempotency
DROP TRIGGER IF EXISTS trg_comp_registration_email ON public.cp_comp_schools;

-- 2) Create AFTER INSERT trigger to call the handler
CREATE TRIGGER trg_comp_registration_email
AFTER INSERT ON public.cp_comp_schools
FOR EACH ROW
EXECUTE FUNCTION public.handle_comp_registration_email();