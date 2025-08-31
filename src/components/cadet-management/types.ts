
export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id: string;
  role?: string; // Keep role field for backward compatibility and role_name sync
  user_roles?: {
    role_name: string;
    role_label: string;
  };
  grade?: string;
  rank?: string;
  flight?: string;
  cadet_year?: string;
  start_year?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewCadet {
  first_name: string;
  last_name: string;
  email: string;
  role_id: string;
  role?: string; // Keep role field for backward compatibility
  grade?: string;
  rank?: string;
  flight?: string;
  cadet_year?: string;
  start_year?: number;
}
