-- First, let's check the current constraint
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.email_rules'::regclass
  AND contype = 'c';