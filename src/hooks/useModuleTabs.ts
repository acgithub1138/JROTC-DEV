import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePermissionContext } from '@/contexts/PermissionContext';

export interface ModuleTab {
  id: string;
  name: string;
  label: string;
  path: string;
  icon: string;
  order?: number;
}

export const useModuleTabs = (parentModuleId: string | null) => {
  const [tabs, setTabs] = useState<ModuleTab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hasPermission } = usePermissionContext();

  useEffect(() => {
    const fetchTabs = async () => {
      if (!parentModuleId) {
        setTabs([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Use a simple text query to avoid TypeScript issues
        const { data, error } = await supabase.rpc('get_permission_modules_simple', {
          is_tab_param: true,
          parent_module_param: parentModuleId,
          is_active_param: true
        });

        if (error) {
          console.error('Error fetching module tabs:', error);
          setTabs([]);
          return;
        }

        const filteredTabs: ModuleTab[] = [];
        if (data && Array.isArray(data)) {
          for (const tab of data) {
            if (hasPermission(tab.name || '', 'read')) {
              filteredTabs.push({
                id: tab.name || '',
                name: tab.name || '',
                label: tab.label || tab.name || '',
                path: tab.path || '',
                icon: tab.icon || 'FileText',
                order: tab.sort_order || 0
              });
            }
          }
        }
        
        setTabs(filteredTabs);
      } catch (error) {
        console.error('Error in fetchTabs:', error);
        setTabs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTabs();
  }, [parentModuleId, hasPermission]);

  return { tabs, isLoading };
};