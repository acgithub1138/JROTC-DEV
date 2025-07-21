
import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Database } from '@/integrations/supabase/types';

export type UserRole = Database['public']['Enums']['user_role'];

interface PermissionContextType {
  hasPermission: (module: string, action: string) => boolean;
  isLoading: boolean;
  error: any;
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
  const { userProfile, loading: authLoading } = useAuth();

  // Fetch all permission data in a single query
  const { data: permissionData, isLoading, error } = useQuery({
    queryKey: ['all-permissions', userProfile?.role, userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.role) {
        console.log('Permission query: No user role available, userProfile:', userProfile);
        return null;
      }

      console.log('Fetching permissions for role:', userProfile.role, 'user:', userProfile.id);
      
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          enabled,
          module:permission_modules(name),
          action:permission_actions(name)
        `)
        .eq('role', userProfile.role);
      
      if (error) {
        console.error('Permission query error:', error);
        throw error;
      }
      
      console.log('Raw permission data received:', data);
      
      // Transform into a lookup map for O(1) access
      const permissionMap: Record<string, boolean> = {};
      data.forEach(permission => {
        if (permission.module?.name && permission.action?.name) {
          const key = `${permission.module.name}:${permission.action.name}`;
          permissionMap[key] = permission.enabled;
          console.log(`Permission: ${key} = ${permission.enabled}`);
        }
      });
      
      console.log('Permission map loaded:', Object.keys(permissionMap).length, 'permissions');
      console.log('Full permission map:', permissionMap);
      return permissionMap;
    },
    enabled: !!userProfile?.role && !authLoading,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Memoized permission checker for optimal performance
  const hasPermission = useMemo(() => {
    return (module: string, action: string): boolean => {
      if (!permissionData || !userProfile?.role) {
        console.log(`Permission check failed: no data or role. Module: ${module}, Action: ${action}, Data exists: ${!!permissionData}, Role: ${userProfile?.role}`);
        return false;
      }
      const key = `${module}:${action}`;
      const result = permissionData[key] || false;
      console.log(`Permission check: ${key} = ${result}`);
      return result;
    };
  }, [permissionData, userProfile?.role]);

  const value: PermissionContextType = {
    hasPermission,
    isLoading: isLoading || authLoading,
    error,
  };

  console.log('PermissionContext render - loading:', value.isLoading, 'error:', error, 'permissionData keys:', permissionData ? Object.keys(permissionData).length : 0);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};
