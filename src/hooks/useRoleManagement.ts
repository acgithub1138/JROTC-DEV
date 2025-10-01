import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type UserRole = string;
export type PermissionModule = Database['public']['Tables']['permission_modules']['Row'];
export type PermissionAction = Database['public']['Tables']['permission_actions']['Row'];
export type RolePermission = Database['public']['Tables']['role_permissions']['Row'];

interface RolePermissions {
  [role: string]: {
    [module: string]: {
      [action: string]: boolean;
    };
  };
}

export const useRoleManagement = () => {
  const queryClient = useQueryClient();

  // Fetch all modules
  const { data: modules = [] } = useQuery({
    queryKey: ['permission-modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permission_modules')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch all actions
  const { data: actions = [] } = useQuery({
    queryKey: ['permission-actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permission_actions')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch roles (id and name) for resolving role_id
  const { data: roles = [] } = useQuery({
    queryKey: ['user-roles-basic'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id, role_name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch all role permissions
  const { data: allRolePermissions = [] } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          *,
          module:permission_modules(*),
          action:permission_actions(*),
          role:user_roles(role_name)
        `);
      
      if (error) throw error;
      
      console.log('Fetched role permissions:', data?.length, 'total permissions');
      return data;
    },
  });

  // Get all permissions for a specific role
  const getRolePermissions = useCallback((role: UserRole): RolePermissions[string] => {
    const rolePerms: { [module: string]: { [action: string]: boolean } } = {};

    const matchedRole = roles.find(r => r.role_name === role);
    const roleId = matchedRole?.id;
    if (!roleId) {
      console.warn('Role ID not found for role name:', role);
    } else {
      console.log('Resolved role to role_id:', { role, roleId });
    }
    
    modules.forEach(module => {
      rolePerms[module.id] = {};
      actions.forEach(action => {
        const permission = allRolePermissions.find(p => (
          (roleId ? p.role_id === roleId : p.role?.role_name === role) &&
          p.module_id === module.id &&
          p.action_id === action.id
        ));
        rolePerms[module.id][action.id] = permission?.enabled ?? false;
      });
    });

    console.log(`Role permissions for ${role} (total: ${Object.keys(rolePerms).length} modules):`, rolePerms);
    return rolePerms;
  }, [modules, actions, allRolePermissions, roles]);

  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ role, moduleId, actionId, enabled }: {
      role: UserRole;
      moduleId: string;
      actionId: string;
      enabled: boolean;
    }) => {
      console.log('updatePermissionMutation starting:', { role, moduleId, actionId, enabled });
      
      // First get the role_id for the given role name
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role_name', role)
        .single();
      
      if (roleError) {
        console.error('Error fetching role_id:', roleError);
        throw roleError;
      }
      
      console.log('Found role_id:', roleData.id);
      
      const upsertData = {
        role_id: roleData.id,
        module_id: moduleId,
        action_id: actionId,
        enabled,
      };
      
      console.log('Upserting permission:', upsertData);
      
      const { data, error } = await supabase
        .from('role_permissions')
        .upsert(upsertData as any, {
          onConflict: 'role_id,module_id,action_id'
        })
        .select();
      
      if (error) {
        console.error('Error upserting permission:', error);
        throw error;
      }
      
      console.log('Permission upserted successfully:', data);
      return data;
    },
    onSuccess: async (data, variables) => {
      console.log('updatePermissionMutation success, invalidating and refetching queries');
      // Both invalidate AND refetch to ensure UI updates
      await queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      await queryClient.refetchQueries({ queryKey: ['role-permissions'] });
    },
    onError: (error, variables) => {
      console.error('updatePermissionMutation error:', error, 'Variables:', variables);
    },
  });

  // Reset to defaults mutation
  const resetToDefaultsMutation = useMutation({
    mutationFn: async (role: UserRole) => {
      // First get the role_id for the given role name
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role_name', role)
        .single();
      
      if (roleError) throw roleError;
      
      // Delete existing permissions for the role
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleData.id);

      // Then copy from defaults - join with user_roles to get role_id
      const { data: defaults, error: defaultsError } = await supabase
        .from('default_role_permissions')
        .select(`
          *,
          role_id:user_roles!inner(id, role_name)
        `)
        .eq('user_roles.role_name', role);

      if (defaultsError) throw defaultsError;

      if (defaults.length > 0) {
        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(
            defaults.map(d => ({
              role_id: d.role_id?.id,
              module_id: d.module_id,
              action_id: d.action_id,
              enabled: d.enabled,
            })) as any
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
    },
  });

  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['permission-actions'] });
    queryClient.invalidateQueries({ queryKey: ['permission-modules'] });
    queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
  }, [queryClient]);

  return {
    modules,
    actions,
    allRolePermissions,
    getRolePermissions,
    updatePermission: updatePermissionMutation.mutate,
    resetToDefaults: resetToDefaultsMutation.mutate,
    isUpdating: updatePermissionMutation.isPending,
    isResetting: resetToDefaultsMutation.isPending,
    refreshData,
  };
};