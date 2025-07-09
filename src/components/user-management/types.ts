export type UserRole = 'admin' | 'instructor' | 'command_staff' | 'cadet' | 'parent';

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
}

export interface School {
  id: string;
  name: string;
}