
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MenuItem {
  id: string;
  label: string;
  icon: any;
}

const getDefaultMenuItemsForRole = (role: string): MenuItem[] => {
  const baseItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home' },
  ];

  switch (role) {
    case 'admin':
      return [
        ...baseItems,
        { id: 'user-admin', label: 'User Management', icon: 'UserCog' },
        { id: 'school-management', label: 'School Management', icon: 'Building2' },
        { id: 'tasks', label: 'Tasks', icon: 'CheckSquare' },
        { id: 'rules', label: 'Business Rules', icon: 'Workflow' },
        { id: 'email-management', label: 'Email', icon: 'Mails' },
        { id: 'smtp-settings', label: 'SMTP Settings', icon: 'Settings' },
        { id: 'settings', label: 'Settings', icon: 'Settings' },
      ];
    
    case 'instructor':
      return [
        ...baseItems,
        { id: 'cadets', label: 'Cadets', icon: 'User' },
        { id: 'job-board', label: 'Job Board', icon: 'Briefcase' },
        { id: 'teams', label: 'Teams', icon: 'Users' },
        { id: 'tasks', label: 'Tasks', icon: 'CheckSquare' },
        { id: 'rules', label: 'Business Rules', icon: 'Workflow' },
        { id: 'budget', label: 'Budget', icon: 'DollarSign' },
        { id: 'inventory', label: 'Inventory', icon: 'Package' },
        { id: 'contacts', label: 'Contacts', icon: 'Contact' },
        { id: 'competitions', label: 'Competitions', icon: 'Trophy' },
        { id: 'reports', label: 'Reports', icon: 'BarChart3' },
        { id: 'calendar', label: 'Calendar', icon: 'Calendar' },
        { id: 'documents', label: 'Documents', icon: 'FileText' },
        { id: 'email-management', label: 'Email', icon: 'Mails' },
        { id: 'settings', label: 'Settings', icon: 'Settings' },
      ];
    
    case 'command_staff':
    case 'cadet':
      return [
        ...baseItems,
        { id: 'cadets', label: 'Cadets', icon: 'User' },
        { id: 'job-board', label: 'Job Board', icon: 'Briefcase' },        
        { id: 'teams', label: 'Teams', icon: 'Users' },
        { id: 'tasks', label: 'Tasks', icon: 'CheckSquare' },
        { id: 'rules', label: 'Business Rules', icon: 'Workflow' },
        { id: 'competitions', label: 'Competitions', icon: 'Trophy' },
        { id: 'calendar', label: 'Calendar', icon: 'Calendar' },
        { id: 'settings', label: 'Settings', icon: 'Settings' },
      ];
    
    default:
      return baseItems;
  }
};

export const useSidebarPreferences = () => {
  const { userProfile } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPreferences = useCallback(async () => {
    if (!userProfile?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_sidebar_preferences')
        .select('menu_items')
        .eq('user_id', userProfile.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading sidebar preferences:', error);
        return;
      }

      const defaultItems = getDefaultMenuItemsForRole(userProfile.role || 'cadet');
      
      if (data?.menu_items && Array.isArray(data.menu_items) && data.menu_items.length > 0) {
        // Filter out invalid items and ensure all valid items are included
        const savedItemIds = data.menu_items;
        const validItems = defaultItems.filter(item => savedItemIds.includes(item.id));
        const orderedItems = savedItemIds
          .map(id => defaultItems.find(item => item.id === id))
          .filter(Boolean) as MenuItem[];
        
        setMenuItems(orderedItems);
      } else {
        setMenuItems(defaultItems);
      }
    } catch (error) {
      console.error('Error loading sidebar preferences:', error);
      setMenuItems(getDefaultMenuItemsForRole(userProfile.role || 'cadet'));
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.id, userProfile?.role]);

  const savePreferences = async (newMenuItems: MenuItem[]) => {
    if (!userProfile?.id) {
      console.error('No user profile found');
      return false;
    }

    try {
      const menuItemIds = newMenuItems.map(item => item.id);
      
      console.log('Saving sidebar preferences for user:', userProfile.id, 'with items:', menuItemIds);
      
      const { error } = await supabase
        .from('user_sidebar_preferences')
        .upsert({
          user_id: userProfile.id,
          menu_items: menuItemIds,
        }, { 
          onConflict: 'user_id' 
        });

      if (error) {
        console.error('Error saving sidebar preferences:', error);
        return false;
      }

      console.log('Successfully saved sidebar preferences');
      setMenuItems(newMenuItems);
      return true;
    } catch (error) {
      console.error('Exception while saving sidebar preferences:', error);
      return false;
    }
  };

  const resetToDefault = async () => {
    if (!userProfile?.id) return false;

    try {
      await supabase
        .from('user_sidebar_preferences')
        .delete()
        .eq('user_id', userProfile.id);

      const defaultItems = getDefaultMenuItemsForRole(userProfile.role || 'cadet');
      setMenuItems(defaultItems);
      return true;
    } catch (error) {
      console.error('Error resetting sidebar preferences:', error);
      return false;
    }
  };

  const refreshPreferences = useCallback(async () => {
    await loadPreferences();
  }, [loadPreferences]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    menuItems,
    isLoading,
    savePreferences,
    resetToDefault,
    refreshPreferences,
    getDefaultMenuItems: () => getDefaultMenuItemsForRole(userProfile?.role || 'cadet'),
  };
};
