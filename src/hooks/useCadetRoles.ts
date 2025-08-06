
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
      console.log('Fetching assignable roles for cadet management...');
      const { data, error } = await supabase.rpc('get_assignable_roles');
      if (error) {
        console.error('Error fetching assignable roles:', error);
        throw error;
      }
      console.log('Assignable roles for cadets fetched successfully:', data);
      return data as { role_name: string; role_label: string; can_be_assigned: boolean }[];
    }
  });

  // Convert to cadet management format
  const roleOptions = useMemo(() => {
    if (!assignableRoles?.length) {
      // Fallback to default roles if dynamic roles aren't loaded yet
      console.log('Using fallback roles for cadet management');
      return [
        { value: 'cadet', label: 'Cadet' },
        { value: 'command_staff', label: 'Command Staff' }
      ];
    }

    const options = assignableRoles
      .filter(role => role.can_be_assigned)
      .map(role => ({
        value: role.role_name,
        label: role.role_label
      }));

    console.log('Role options for cadet management:', options);
    return options;
  }, [assignableRoles]);

  return {
    roleOptions,
    isLoading: isLoadingAssignableRoles
  };
};
