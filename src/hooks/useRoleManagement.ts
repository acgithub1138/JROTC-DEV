import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type UserRole = Database['public']['Enums']['user_role'];
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
        .order('label');
      
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
        .order('label');
      
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
          role_id:user_roles(role_name)
        `);
      
      if (error) throw error;
      return data;
    },
  });

  // Get all permissions for a specific role
  const getRolePermissions = useCallback((role: UserRole): RolePermissions[string] => {
    const rolePerms: { [module: string]: { [action: string]: boolean } } = {};
    
    modules.forEach(module => {
      rolePerms[module.name] = {};
      actions.forEach(action => {
        const permission = allRolePermissions.find(
          p => p.role_id?.role_name === role && 
               p.module?.name === module.name && 
               p.action?.name === action.name
        );
        rolePerms[module.name][action.name] = permission?.enabled || false;
      });
    });
    
    return rolePerms;
  }, [modules, actions, allRolePermissions]);

  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ role, moduleId, actionId, enabled }: {
      role: UserRole;
      moduleId: string;
      actionId: string;
      enabled: boolean;
    }) => {
      // First get the role_id for the given role name
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role_name', role)
        .single();
      
      if (roleError) throw roleError;
      
      const { data, error } = await supabase
        .from('role_permissions')
        .upsert({
          role_id: roleData.id,
          module_id: moduleId,
          action_id: actionId,
          enabled,
        } as any, {
          onConflict: 'role_id,module_id,action_id'
        })
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
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