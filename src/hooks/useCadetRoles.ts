
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export interface CadetRoleOption {
  value: string;
  label: string;
}

export const useCadetRoles = () => {
  // Get assignable roles from the user_roles table
  const { data: assignableRoles, isLoading: isLoadingAssignableRoles } = useQuery({
    queryKey: ['assignable-roles'],
    queryFn: async () => {
      console.log('Fetching assignable roles for cadet management...');
      const { data, error } = await supabase
        .from('user_roles')
        .select('id, role_name, role_label, admin_only, is_active')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) {
        console.error('Error fetching assignable roles:', error);
        throw error;
      }
      console.log('Assignable roles for cadets fetched successfully:', data);
      return data as { id: string; role_name: string; role_label: string; admin_only: boolean; is_active: boolean }[];
    }
  });

  // Convert to cadet management format
  const roleOptions = useMemo(() => {
    if (!assignableRoles?.length) {
      // Fallback to default roles if dynamic roles aren't loaded yet
      console.log('Using fallback roles for cadet management');
      return [];
    }

    const options = assignableRoles
      .filter(role => !role.admin_only) // Filter out admin-only roles for cadets
      .map(role => ({
        value: role.id, // Use role ID as the value
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
