import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Database } from '@/integrations/supabase/types';

export type UserRole = Database['public']['Enums']['user_role'];

interface PermissionContextType {
  hasPermission: (module: string, action: string) => boolean;
  isLoading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const usePermissionContext = () => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissionContext must be used within a PermissionProvider');
  }
  return context;
};

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile } = useAuth();

  // Fetch all permission data in a single query
  const { data: permissionData, isLoading } = useQuery({
    queryKey: ['all-permissions', userProfile?.role, (userProfile as any)?.role_id, userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.role) {
        console.log('Permission query: No user role available');
        return null;
      }

      const roleId = (userProfile as any)?.role_id;
      console.log('Fetching permissions for role:', userProfile.role, 'role_id:', roleId);
      
      let query = supabase
        .from('role_permissions')
        .select(`
          enabled,
          module:permission_modules(name),
          action:permission_actions(name),
          role_id:user_roles!inner(role_name)
        `);

      // Handle both migrated users (with role_id) and unmigrated users (with only role enum)
      if (roleId) {
        // User has been migrated to new role system - query by role_id directly
        console.log('Using role_id for query:', roleId);
        query = query.eq('role_id', roleId);
      } else {
        // User still using old role enum system - query by role name
        console.log('Using role name for query:', userProfile.role);
        query = query.eq('role_id.role_name', userProfile.role);
      }
      
      const { data, error } = await query;
      
      console.log('Permission query result:', { data, error, userRole: userProfile.role, roleId });
      
      if (error) {
        console.error('Permission query error:', error);
        throw error;
      }
      
      // Transform into a lookup map for O(1) access
      const permissionMap: Record<string, boolean> = {};
      data.forEach(permission => {
        if (permission.module?.name && permission.action?.name) {
          const key = `${permission.module.name}:${permission.action.name}`;
          permissionMap[key] = permission.enabled;
        }
      });
      
      console.log('Permission map loaded:', Object.keys(permissionMap).length, 'permissions');
      return permissionMap;
    },
    enabled: !!userProfile?.role,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Memoized permission checker for optimal performance
  const hasPermission = useMemo(() => {
    return (module: string, action: string): boolean => {
      if (!permissionData || !userProfile?.role) return false;
      const key = `${module}:${action}`;
      return permissionData[key] || false;
    };
  }, [permissionData, userProfile?.role]);

  const value: PermissionContextType = {
    hasPermission,
    isLoading,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};