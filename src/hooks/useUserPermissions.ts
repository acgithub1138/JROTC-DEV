import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUserPermissions = () => {
  const { userProfile } = useAuth();
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      if (!userProfile?.id) {
        setLoading(false);
        return;
      }

      try {
        // Get all modules and actions
        const { data: modules } = await supabase
          .from('permission_modules')
          .select('*');

        const { data: actions } = await supabase
          .from('permission_actions')
          .select('*');

        if (!modules || !actions) {
          setLoading(false);
          return;
        }

        // Build permissions object
        const userPermissions: Record<string, Record<string, boolean>> = {};

        for (const module of modules) {
          userPermissions[module.name] = {};
          
          for (const action of actions) {
            const { data: hasPermission } = await supabase
              .rpc('check_user_permission', {
                user_id: userProfile.id,
                module_name: module.name,
                action_name: action.name
              });

            userPermissions[module.name][action.name] = hasPermission || false;
          }
        }

        setPermissions(userPermissions);
      } catch (error) {
        console.error('Error loading permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [userProfile?.id]);

  const hasPermission = (moduleName: string, actionName: string): boolean => {
    return permissions[moduleName]?.[actionName] || false;
  };

  const canCreate = (moduleName: string): boolean => {
    return hasPermission(moduleName, 'create');
  };

  const canBulkImport = (moduleName: string): boolean => {
    return hasPermission(moduleName, 'bulk_import');
  };

  const canRead = (moduleName: string): boolean => {
    return hasPermission(moduleName, 'read');
  };

  const canUpdate = (moduleName: string): boolean => {
    return hasPermission(moduleName, 'update');
  };

  const canDelete = (moduleName: string): boolean => {
    return hasPermission(moduleName, 'delete');
  };

  const canAssign = (moduleName: string): boolean => {
    return hasPermission(moduleName, 'assign');
  };

  const hasSidebarAccess = (moduleName: string): boolean => {
    return hasPermission(moduleName, 'sidebar');
  };

  return {
    permissions,
    loading,
    hasPermission,
    canCreate,
    canBulkImport,
    canRead,
    canUpdate,
    canDelete,
    canAssign,
    hasSidebarAccess
  };
};