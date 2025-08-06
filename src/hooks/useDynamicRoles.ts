
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export interface DynamicRole {
  id: string;
  role_name: string;
  role_label: string;
  admin_only: boolean;
  is_active: boolean;
  sort_order: number;
}

export const useDynamicRoles = () => {
  // Get all roles from the user_roles table
  const { data: allRoles, isLoading: isLoadingAllRoles, error } = useQuery({
    queryKey: ['all-roles'],
    queryFn: async () => {
      console.log('Fetching all roles...');
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) {
        console.error('Error fetching all roles:', error);
        throw error;
      }
      console.log('All roles fetched successfully:', data);
      return data as DynamicRole[];
    }
  });

  // Get assignable roles using the RPC function
  const { data: assignableRoles, isLoading: isLoadingAssignableRoles } = useQuery({
    queryKey: ['assignable-roles'],
    queryFn: async () => {
      console.log('Fetching assignable roles...');
      const { data, error } = await supabase.rpc('get_assignable_roles');
      if (error) {
        console.error('Error fetching assignable roles:', error);
        throw error;
      }
      console.log('Assignable roles fetched successfully:', data);
      return data as { role_name: string; role_label: string; can_be_assigned: boolean }[];
    }
  });

  // Convert assignable roles to the expected format
  const roleOptions = useMemo(() => {
    if (!assignableRoles?.length) {
      // Fallback to default roles if dynamic roles aren't loaded yet
      return [
        { value: 'cadet', label: 'Cadet' },
        { value: 'command_staff', label: 'Command Staff' },
        { value: 'instructor', label: 'Instructor' }
      ];
    }

    return assignableRoles
      .filter(role => role.can_be_assigned)
      .map(role => ({
        value: role.role_name,
        label: role.role_label
      }));
  }, [assignableRoles]);

  return {
    allRoles: allRoles || [],
    assignableRoles: assignableRoles || [],
    roleOptions,
    isLoadingAllRoles,
    isLoadingAssignableRoles,
    isLoading: isLoadingAllRoles || isLoadingAssignableRoles,
    error
  };
};
