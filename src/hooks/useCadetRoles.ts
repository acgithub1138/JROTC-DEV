import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export interface CadetRoleOption {
  value: string;
  label: string;
}

export const useCadetRoles = () => {
  // Get assignable roles from the new user_roles table
  const { data: assignableRoles, isLoading: isLoadingAssignableRoles } = useQuery({
    queryKey: ['assignable-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_assignable_roles');
      if (error) throw error;
      return data as { role_name: string; role_label: string; can_be_assigned: boolean }[];
    }
  });

  // Convert to cadet management format
  const roleOptions = useMemo(() => {
    if (!assignableRoles?.length) {
      // Fallback to default roles if dynamic roles aren't loaded yet
      return [
        { value: 'cadet', label: 'Cadet' },
        { value: 'command_staff', label: 'Command Staff' }
      ];
    }

    return assignableRoles.map(role => ({
      value: role.role_name,
      label: role.role_label
    }));
  }, [assignableRoles]);

  return {
    roleOptions,
    isLoading: isLoadingAssignableRoles
  };
};