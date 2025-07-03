-- Create enums for budget transaction system
CREATE TYPE budget_transaction_category AS ENUM ('expense', 'income');
CREATE TYPE expense_type AS ENUM ('equipment', 'travel', 'meals', 'supplies', 'other');
CREATE TYPE income_type AS ENUM ('fundraiser', 'donation', 'other');
CREATE TYPE payment_method AS ENUM ('cash', 'check', 'debit_card', 'credit_card', 'other');
CREATE TYPE expense_status AS ENUM ('pending', 'paid', 'not_paid');

-- Create budget_transactions table
CREATE TABLE public.budget_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id),
  item TEXT NOT NULL,
  category budget_transaction_category NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method payment_method,
  status expense_status,
  archive BOOLEAN NOT NULL DEFAULT false,
  budget_year TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.budget_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for school data isolation
CREATE POLICY "Users can view budget transactions from their school"
ON public.budget_transactions
FOR SELECT
USING (school_id = get_current_user_school_id());

CREATE POLICY "Users can create budget transactions for their school"
ON public.budget_transactions
FOR INSERT
WITH CHECK (school_id = get_current_user_school_id());

CREATE POLICY "Users can update budget transactions from their school"
ON public.budget_transactions
FOR UPDATE
USING (school_id = get_current_user_school_id());

CREATE POLICY "Users can delete budget transactions from their school"
ON public.budget_transactions
FOR DELETE
USING (school_id = get_current_user_school_id());

-- Instructors and admins can manage all budget transactions in their school
CREATE POLICY "Instructors can manage budget transactions in their school"
ON public.budget_transactions
FOR ALL
USING (
  school_id = get_current_user_school_id() AND 
  get_current_user_role() = ANY(ARRAY['instructor', 'command_staff', 'admin'])
)
WITH CHECK (
  school_id = get_current_user_school_id() AND 
  get_current_user_role() = ANY(ARRAY['instructor', 'command_staff', 'admin'])
);

-- Add updated_at trigger
CREATE TRIGGER update_budget_transactions_updated_at
  BEFORE UPDATE ON public.budget_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add indexes for better query performance
CREATE INDEX idx_budget_transactions_school_id ON public.budget_transactions(school_id);
CREATE INDEX idx_budget_transactions_category ON public.budget_transactions(category);
CREATE INDEX idx_budget_transactions_archive ON public.budget_transactions(archive);
CREATE INDEX idx_budget_transactions_date ON public.budget_transactions(date);
CREATE INDEX idx_budget_transactions_budget_year ON public.budget_transactions(budget_year);