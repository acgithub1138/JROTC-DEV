import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserRole {
  id: string;
  role_name: string;
  role_label: string;
  admin_only: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useUserRolesManagement = () => {
  const queryClient = useQueryClient();

  // Get all user roles from the table
  const {
    data: userRoles = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data as UserRole[];
    }
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, updates }: {
      id: string;
      updates: Partial<Pick<UserRole, 'role_label' | 'admin_only' | 'is_active' | 'sort_order'>>;
    }) => {
      const { error } = await supabase
        .from('user_roles')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['all-roles'] });
      queryClient.invalidateQueries({ queryKey: ['assignable-roles'] });
      toast.success('Role updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Failed to update role');
    }
  });

  // Add new role mutation
  const addRoleMutation = useMutation({
    mutationFn: async ({ roleName, roleLabel, adminOnly }: {
      roleName: string;
      roleLabel: string;
      adminOnly: boolean;
    }) => {
      const { error } = await supabase.rpc('add_user_role_to_table', {
        role_name_param: roleName,
        role_label_param: roleLabel,
        admin_only_param: adminOnly
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['all-roles'] });
      queryClient.invalidateQueries({ queryKey: ['assignable-roles'] });
      toast.success('Role added successfully');
    },
    onError: (error: any) => {
      console.error('Error adding role:', error);
      toast.error(error.message || 'Failed to add role');
    }
  });

  // Reorder roles mutation
  const reorderRolesMutation = useMutation({
    mutationFn: async (roleUpdates: { id: string; sort_order: number }[]) => {
      const updates = roleUpdates.map(({ id, sort_order }) =>
        supabase
          .from('user_roles')
          .update({ sort_order })
          .eq('id', id)
      );
      
      const results = await Promise.all(updates);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error('Failed to reorder some roles');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['all-roles'] });
      queryClient.invalidateQueries({ queryKey: ['assignable-roles'] });
      toast.success('Roles reordered successfully');
    },
    onError: (error: any) => {
      console.error('Error reordering roles:', error);
      toast.error(error.message || 'Failed to reorder roles');
    }
  });

  return {
    // Data
    userRoles,
    
    // Loading states
    isLoading,
    isUpdating: updateRoleMutation.isPending,
    isAdding: addRoleMutation.isPending,
    isReordering: reorderRolesMutation.isPending,
    
    // Errors
    error,
    
    // Methods
    updateRole: updateRoleMutation.mutate,
    addRole: addRoleMutation.mutate,
    reorderRoles: reorderRolesMutation.mutate,
    refreshRoles: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['all-roles'] });
      queryClient.invalidateQueries({ queryKey: ['assignable-roles'] });
    }
  };
};