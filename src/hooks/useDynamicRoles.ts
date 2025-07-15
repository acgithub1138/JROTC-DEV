import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RoleOption {
  role_name: string;
  role_label: string;
  can_be_assigned?: boolean;
}

export const useDynamicRoles = () => {
  const queryClient = useQueryClient();

  // Get all roles
  const {
    data: allRoles = [],
    isLoading: isLoadingAllRoles,
    error: allRolesError
  } = useQuery({
    queryKey: ['all-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_roles');
      if (error) throw error;
      return data as RoleOption[];
    }
  });

  // Get assignable roles for current user
  const {
    data: assignableRoles = [],
    isLoading: isLoadingAssignableRoles,
    error: assignableRolesError
  } = useQuery({
    queryKey: ['assignable-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_assignable_roles');
      if (error) throw error;
      return data as RoleOption[];
    }
  });

  // Add new role mutation
  const addRoleMutation = useMutation({
    mutationFn: async ({ roleName, displayLabel, isAdminOnly }: {
      roleName: string;
      displayLabel?: string;
      isAdminOnly?: boolean;
    }) => {
      // First, add the role to the enum
      const { error: addRoleError } = await supabase.rpc('add_user_role', {
        role_name: roleName,
        display_label: displayLabel,
        is_admin_only: isAdminOnly || false
      });
      if (addRoleError) throw addRoleError;

      // Then, set up permissions for the role (this needs to happen after the enum is committed)
      const { error: setupError } = await supabase.rpc('setup_role_permissions', {
        role_name: roleName
      });
      if (setupError) throw setupError;
    },
    onSuccess: () => {
      // Invalidate and refetch role-related queries
      queryClient.invalidateQueries({ queryKey: ['all-roles'] });
      queryClient.invalidateQueries({ queryKey: ['assignable-roles'] });
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success('Role added successfully');
    },
    onError: (error: any) => {
      console.error('Error adding role:', error);
      toast.error(error.message || 'Failed to add role');
    }
  });

  return {
    // Data
    allRoles,
    assignableRoles,
    
    // Loading states
    isLoadingAllRoles,
    isLoadingAssignableRoles,
    isAddingRole: addRoleMutation.isPending,
    
    // Errors
    allRolesError,
    assignableRolesError,
    
    // Methods
    addRole: addRoleMutation.mutate,
    refreshRoles: () => {
      queryClient.invalidateQueries({ queryKey: ['all-roles'] });
      queryClient.invalidateQueries({ queryKey: ['assignable-roles'] });
    }
  };
};