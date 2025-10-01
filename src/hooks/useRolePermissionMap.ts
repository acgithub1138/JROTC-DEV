import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { UserRole } from '@/hooks/useRoleManagement';

// Build a role-scoped permissions map directly from role_permission_details view
// Map shape: { [module_id]: { [action_id]: boolean } }
export const useRolePermissionMap = (selectedRole: UserRole) => {
  // Fetch permissions directly from the view using role_name (no need for role_id lookup)
  const {
    data: rolePerms = [],
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['role-permissions-by-role', selectedRole],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permission_details')
        .select('module_id, action_id, enabled')
        .eq('role_name', selectedRole);
      if (error) throw error;
      return data as Array<{ module_id: string; action_id: string; enabled: boolean }>;
    },
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
    isFetching,
  };
};
