
-- Create enum types for better data consistency
CREATE TYPE public.rank_type AS ENUM (
  'cadet_private', 'cadet_private_first_class', 'cadet_corporal', 'cadet_sergeant',
  'cadet_staff_sergeant', 'cadet_sergeant_first_class', 'cadet_master_sergeant',
  'cadet_first_sergeant', 'cadet_sergeant_major', 'cadet_second_lieutenant',
  'cadet_first_lieutenant', 'cadet_captain', 'cadet_major', 'cadet_lieutenant_colonel', 'cadet_colonel'
);

CREATE TYPE public.user_role AS ENUM ('school_admin', 'instructor', 'nco', 'cadet');
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue', 'cancelled');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.budget_category AS ENUM ('equipment', 'uniforms', 'travel', 'competition', 'training', 'administrative', 'other');
CREATE TYPE public.inventory_status AS ENUM ('available', 'checked_out', 'maintenance', 'damaged', 'lost');
CREATE TYPE public.competition_type AS ENUM ('drill', 'marksmanship', 'academic', 'leadership', 'physical_fitness', 'inspection');

-- Schools table (multi-tenant base)
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  district TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role public.user_role NOT NULL DEFAULT 'cadet',
  rank public.rank_type,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cadets table (extended profile information)
CREATE TABLE public.cadets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  cadet_id TEXT NOT NULL, -- School-specific cadet ID
  grade_level INTEGER,
  date_of_birth DATE,
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_conditions TEXT,
  uniform_size TEXT,
  enlistment_date DATE,
  graduation_date DATE,
  gpa DECIMAL(3,2),
  attendance_percentage DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(school_id, cadet_id)
);

-- Teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  team_lead_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Team members junction table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  cadet_id UUID REFERENCES public.cadets(id) ON DELETE CASCADE NOT NULL,
  role TEXT,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, cadet_id)
);

-- Tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status NOT NULL DEFAULT 'pending',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Budget table
CREATE TABLE public.budget (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category public.budget_category NOT NULL,
  allocated_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  spent_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  fiscal_year INTEGER NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  budget_id UUID REFERENCES public.budget(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  vendor TEXT,
  receipt_url TEXT,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  organization TEXT,
  title TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inventory items table
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  serial_number TEXT,
  status public.inventory_status NOT NULL DEFAULT 'available',
  location TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  condition TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inventory checkout log
CREATE TABLE public.inventory_checkout (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  cadet_id UUID REFERENCES public.cadets(id) ON DELETE CASCADE NOT NULL,
  checked_out_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  checked_out_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expected_return_date DATE,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_in_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  condition_on_return TEXT,
  notes TEXT
);

-- Competitions table
CREATE TABLE public.competitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type public.competition_type NOT NULL,
  location TEXT,
  competition_date DATE NOT NULL,
  registration_deadline DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Competition results table
CREATE TABLE public.competition_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  cadet_id UUID REFERENCES public.cadets(id) ON DELETE SET NULL,
  placement INTEGER,
  score DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_checkout ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_results ENABLE ROW LEVEL SECURITY;

-- Create function to get user's school ID
CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$;

-- RLS Policies for school-based data isolation

-- Schools policies
CREATE POLICY "Users can view their own school" ON public.schools
  FOR SELECT USING (id = public.get_user_school_id());

CREATE POLICY "School admins can update their school" ON public.schools
  FOR UPDATE USING (
    id = public.get_user_school_id() AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'school_admin')
  );

-- Profiles policies
CREATE POLICY "Users can view profiles in their school" ON public.profiles
  FOR SELECT USING (school_id = public.get_user_school_id());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Generic school-based policies for other tables
CREATE POLICY "School data isolation" ON public.cadets
  FOR ALL USING (school_id = public.get_user_school_id());

CREATE POLICY "School data isolation" ON public.teams
  FOR ALL USING (school_id = public.get_user_school_id());

CREATE POLICY "School data isolation" ON public.team_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND school_id = public.get_user_school_id())
  );

CREATE POLICY "School data isolation" ON public.tasks
  FOR ALL USING (school_id = public.get_user_school_id());

CREATE POLICY "School data isolation" ON public.budget
  FOR ALL USING (school_id = public.get_user_school_id());

CREATE POLICY "School data isolation" ON public.expenses
  FOR ALL USING (school_id = public.get_user_school_id());

CREATE POLICY "School data isolation" ON public.contacts
  FOR ALL USING (school_id = public.get_user_school_id());

CREATE POLICY "School data isolation" ON public.inventory_items
  FOR ALL USING (school_id = public.get_user_school_id());

CREATE POLICY "School data isolation" ON public.inventory_checkout
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.inventory_items WHERE id = item_id AND school_id = public.get_user_school_id())
  );

-- Competitions are global, results are school-specific
CREATE POLICY "Anyone can view competitions" ON public.competitions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "School data isolation" ON public.competition_results
  FOR ALL USING (school_id = public.get_user_school_id());

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.cadets
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.budget
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, school_id, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    -- Default to first school if no school specified, or create logic to assign
    (SELECT id FROM public.schools LIMIT 1),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Unknown'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'cadet')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
