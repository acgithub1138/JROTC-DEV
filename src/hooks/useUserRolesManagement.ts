
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
      console.log('Fetching user roles...');
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('sort_order');
      
      if (error) {
        console.error('Error fetching user roles:', error);
        throw error;
      }
      console.log('User roles fetched successfully:', data);
      return data as UserRole[];
    }
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, updates }: {
      id: string;
      updates: Partial<Pick<UserRole, 'role_label' | 'admin_only' | 'is_active' | 'sort_order'>>;
    }) => {
      console.log('Updating role:', id, updates);
      const { error } = await supabase
        .from('user_roles')
        .update(updates)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating role:', error);
        throw error;
      }
      console.log('Role updated successfully');
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
      console.log('Adding new role:', roleName, roleLabel, adminOnly);
      const { error } = await supabase.rpc('add_user_role_to_table', {
        role_name_param: roleName,
        role_label_param: roleLabel,
        admin_only_param: adminOnly
      });
      if (error) {
        console.error('Error adding role:', error);
        throw error;
      }
      console.log('Role added successfully');
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
      console.log('Reordering roles:', roleUpdates);
      const updates = roleUpdates.map(({ id, sort_order }) =>
        supabase
          .from('user_roles')
          .update({ sort_order })
          .eq('id', id)
      );
      
      const results = await Promise.all(updates);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        console.error('Errors reordering roles:', errors);
        throw new Error('Failed to reorder some roles');
      }
      console.log('Roles reordered successfully');
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
