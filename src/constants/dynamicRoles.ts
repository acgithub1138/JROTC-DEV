import { Database } from "@/integrations/supabase/types";

export type UserRole = string;

export interface RoleOption {
  value: UserRole;
  label: string;
}

// This will be replaced by dynamic fetching in components
export const DEFAULT_ROLE_OPTIONS: RoleOption[] = [
  { value: 'cadet' as UserRole, label: 'Cadet' },
  { value: 'command_staff' as UserRole, label: 'Command Staff' }
];