import { Database } from '@/integrations/supabase/types';

export type UserRole = Database['public']['Enums']['user_role'];

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  rank?: string;
  created_at: string;
  school_id: string;
  active: boolean;
  schools?: { name: string };
  user_roles?: { role_name: string };
}

export interface School {
  id: string;
  name: string;
}