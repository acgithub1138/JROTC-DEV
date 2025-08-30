-- Force regeneration of TypeScript types by adding a comment
-- This will update the generated types to include the uniform_inspections table

-- Add a comment to the uniform_inspections table to trigger type regeneration
COMMENT ON TABLE public.uniform_inspections IS 'Stores uniform inspection records for cadets';