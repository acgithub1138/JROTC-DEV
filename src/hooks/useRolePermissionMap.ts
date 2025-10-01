import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { UserRole } from '@/hooks/useRoleManagement';

// Build a role-scoped permissions map directly from role_permissions without joins
// Map shape: { [module_id]: { [action_id]: boolean } }
export const useRolePermissionMap = (selectedRole: UserRole) => {
  // Resolve role_id from role_name
  const { data: role, isFetching: isFetchingRole } = useQuery({
    queryKey: ['user-role-id', selectedRole],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id, role_name')
        .eq('role_name', selectedRole)
        .single();
      if (error) throw error;
      return data as Pick<Database['public']['Tables']['user_roles']['Row'], 'id' | 'role_name'>;
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const roleId = role?.id ?? null;

  // Fetch only this role's permissions (raw ids, no joins)
  const {
    data: rolePerms = [],
    refetch,
    isFetching: isFetchingPerms,
  } = useQuery({
    queryKey: ['role-permissions-by-role', roleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('role_id, module_id, action_id, enabled')
        .eq('role_id', roleId as string);
      if (error) throw error;
      return data as Array<Pick<Database['public']['Tables']['role_permissions']['Row'], 'role_id' | 'module_id' | 'action_id' | 'enabled'>>;
    },
    enabled: !!roleId,
    staleTime: 0,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });

  // Build the map used by the tables
  const rolePermissionsMap = useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {};
    for (const p of rolePerms) {
      if (!map[p.module_id]) map[p.module_id] = {};
      map[p.module_id][p.action_id] = !!p.enabled;
    }
    return map;
  }, [rolePerms]);

  return {
    rolePermissionsMap,
    refetch,
    isFetching: isFetchingRole || isFetchingPerms,
  };
};
