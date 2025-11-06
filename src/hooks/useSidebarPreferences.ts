import { useSidebarPreferencesContext } from '@/contexts/SidebarPreferencesContext';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  isVisible: boolean;
  order: number;
  parent_module?: string;
  children?: MenuItem[];
  level?: number;
}

// Updated hook to use the context
export const useSidebarPreferences = () => {
  const context = useSidebarPreferencesContext();
  if (!context) {
    throw new Error('useSidebarPreferences must be used within a SidebarPreferencesProvider');
  }
  return context;
};