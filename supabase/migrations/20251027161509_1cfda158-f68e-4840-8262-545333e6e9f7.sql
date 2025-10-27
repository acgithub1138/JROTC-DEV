-- Phase 1: Judges Portal - Database Schema

-- Create update timestamp function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add "judge" role to user_roles table
INSERT INTO public.user_roles (role_name, role_label, admin_only, is_active, sort_order)
VALUES ('judge', 'Judge', false, true, 100)
ON CONFLICT (role_name) DO NOTHING;

-- Modify cp_judges table to support judge user accounts
ALTER TABLE public.cp_judges
  ALTER COLUMN school_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_cp_judges_user_id ON public.cp_judges(user_id);

-- Create cp_judge_competition_registrations table
CREATE TABLE IF NOT EXISTS public.cp_judge_competition_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id uuid NOT NULL REFERENCES public.cp_judges(id) ON DELETE CASCADE,
  competition_id uuid NOT NULL REFERENCES public.cp_competitions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'withdrawn')),
  availability_notes text,
  decline_reason text,
  created_by uuid REFERENCES public.profiles(id),
  updated_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(judge_id, competition_id)
);

-- Create indexes for cp_judge_competition_registrations
CREATE INDEX IF NOT EXISTS idx_judge_comp_regs_judge ON public.cp_judge_competition_registrations(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_comp_regs_competition ON public.cp_judge_competition_registrations(competition_id);
CREATE INDEX IF NOT EXISTS idx_judge_comp_regs_status ON public.cp_judge_competition_registrations(status);

-- Add trigger for updated_at on cp_judge_competition_registrations
DROP TRIGGER IF EXISTS update_cp_judge_competition_registrations_updated_at ON public.cp_judge_competition_registrations;
CREATE TRIGGER update_cp_judge_competition_registrations_updated_at
  BEFORE UPDATE ON public.cp_judge_competition_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for cp_judge_competition_registrations

-- Enable RLS
ALTER TABLE public.cp_judge_competition_registrations ENABLE ROW LEVEL SECURITY;

-- Judges can view their own applications
CREATE POLICY "Judges can view their own applications"
  ON public.cp_judge_competition_registrations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cp_judges
      WHERE cp_judges.id = cp_judge_competition_registrations.judge_id
      AND cp_judges.user_id = auth.uid()
    )
  );

-- Judges can create applications for themselves
CREATE POLICY "Judges can create their own applications"
  ON public.cp_judge_competition_registrations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cp_judges
      WHERE cp_judges.id = cp_judge_competition_registrations.judge_id
      AND cp_judges.user_id = auth.uid()
    )
  );

-- Judges can withdraw their pending applications
CREATE POLICY "Judges can withdraw pending applications"
  ON public.cp_judge_competition_registrations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cp_judges
      WHERE cp_judges.id = cp_judge_competition_registrations.judge_id
      AND cp_judges.user_id = auth.uid()
    )
    AND status = 'pending'
  )
  WITH CHECK (status = 'withdrawn');

-- Schools can view applications for their competitions
CREATE POLICY "Schools can view applications for their competitions"
  ON public.cp_judge_competition_registrations
  FOR SELECT
  USING (
    is_current_user_admin_role() OR
    EXISTS (
      SELECT 1 FROM public.cp_competitions
      WHERE cp_competitions.id = cp_judge_competition_registrations.competition_id
      AND is_user_in_school(cp_competitions.school_id)
    )
  );

-- Schools can update applications for their competitions
CREATE POLICY "Schools can manage applications for their competitions"
  ON public.cp_judge_competition_registrations
  FOR UPDATE
  USING (
    is_current_user_admin_role() OR
    EXISTS (
      SELECT 1 FROM public.cp_competitions
      WHERE cp_competitions.id = cp_judge_competition_registrations.competition_id
      AND is_user_in_school(cp_competitions.school_id)
    )
  );

-- Update RLS policies for cp_judges to support judge user accounts

-- Judges can view their own profile
CREATE POLICY "Judges can view their own profile"
  ON public.cp_judges
  FOR SELECT
  USING (user_id = auth.uid());

-- Judges can update their own profile
CREATE POLICY "Judges can update their own profile"
  ON public.cp_judges
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can create their judge profile during signup
CREATE POLICY "Users can create their judge profile"
  ON public.cp_judges
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Schools can view judges for their competitions (through applications)
CREATE POLICY "Schools can view judges for their competitions"
  ON public.cp_judges
  FOR SELECT
  USING (
    is_current_user_admin_role() OR
    EXISTS (
      SELECT 1 FROM public.cp_judge_competition_registrations jcr
      JOIN public.cp_competitions comp ON comp.id = jcr.competition_id
      WHERE jcr.judge_id = cp_judges.id
      AND is_user_in_school(comp.school_id)
    )
  );