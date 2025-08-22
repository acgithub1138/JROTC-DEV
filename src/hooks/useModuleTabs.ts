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
    if (!parentModuleId) {
      setTabs([]);
      setIsLoading(false);
      return;
    }

    // For now, return hardcoded tabs based on parent module until database structure is ready
    const getTabsForModule = (moduleId: string): ModuleTab[] => {
      // Hosting competitions tabs
      if (moduleId.includes('cp_competitions') || moduleId === 'hosting-competitions') {
        return [
          { id: 'events', name: 'cp_comp_events', label: 'Events', path: '', icon: 'Calendar', order: 1 },
          { id: 'resources', name: 'cp_comp_resources', label: 'Resources', path: '', icon: 'Users', order: 2 },
          { id: 'schools', name: 'cp_comp_schools', label: 'Schools', path: '', icon: 'School', order: 3 },
          { id: 'schedule', name: 'cp_schedules', label: 'Schedule', path: '', icon: 'Clock', order: 4 },
          { id: 'results', name: 'cp_results', label: 'Results', path: '', icon: 'Trophy', order: 5 }
        ];
      }
      
      // My competitions tabs
      if (moduleId.includes('my_competitions') || moduleId === 'my-competitions') {
        return [
          { id: 'competitions', name: 'competitions', label: 'My Competitions', path: '', icon: 'Award', order: 1 },
          { id: 'reports', name: 'reports', label: 'Reports', path: '', icon: 'FileText', order: 2 }
        ];
      }
      
      return [];
    };

    const moduleKey = typeof parentModuleId === 'string' ? parentModuleId : '';
    const allTabs = getTabsForModule(moduleKey);
    
    // Filter based on permissions - map tab names to correct module names
    const filteredTabs = allTabs.filter(tab => {
      // Map tab names to their corresponding module names for permission checking
      const moduleNameMap: Record<string, string> = {
        'competitions': 'my_competitions',
        'reports': 'my_competitions_reports'
      };
      
      const moduleName = moduleNameMap[tab.id] || tab.name;
      return hasPermission(moduleName, 'sidebar');
    });
    
    setTabs(filteredTabs);
    setIsLoading(false);
  }, [parentModuleId, hasPermission]);

  return { tabs, isLoading };
};