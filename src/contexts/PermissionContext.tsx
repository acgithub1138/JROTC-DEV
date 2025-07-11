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
    queryKey: ['all-permissions', userProfile?.role],
    queryFn: async () => {
      if (!userProfile?.role) return null;

      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          enabled,
          module:permission_modules(name),
          action:permission_actions(name)
        `)
        .eq('role', userProfile.role);
      
      if (error) throw error;
      
      // Transform into a lookup map for O(1) access
      const permissionMap: Record<string, boolean> = {};
      data.forEach(permission => {
        if (permission.module?.name && permission.action?.name) {
          const key = `${permission.module.name}:${permission.action.name}`;
          permissionMap[key] = permission.enabled;
        }
      });
      
      return permissionMap;
    },
    enabled: !!userProfile?.role,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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
    isLoading: isLoading || !userProfile,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};