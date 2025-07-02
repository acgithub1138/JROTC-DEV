
export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  grade?: string;
  rank?: string;
  flight?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewCadet {
  first_name: string;
  last_name: string;
  email: string;
  role: 'cadet' | 'command_staff';
  grade?: string;
  rank?: string;
  flight?: string;
}
