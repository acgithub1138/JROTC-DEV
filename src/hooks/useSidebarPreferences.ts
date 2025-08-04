import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionContext } from '@/contexts/PermissionContext';

export interface MenuItem {
  id: string;
  label: string;
  icon: any;
}

// Module mapping for permissions
const MODULE_MAPPING: Record<string, string> = {
  'user-admin': 'cadets', // Only admins should see this
  'school-management': 'cadets', // Only admins should see this
  'cadets': 'cadets',
  'tasks': 'tasks',
  'job-board': 'job_board',
  'teams': 'teams',
  'budget': 'budget',
  'inventory': 'inventory',
  'contacts': 'contacts',
  'calendar': 'calendar',
  'competitions': 'competitions',
  'email-management': 'email',
  'incident_management': 'incident_management',
  'role-management': 'cadets', // Only admins should see this
};

const getMenuItemsFromPermissions = (role: string, hasPermission: (module: string, action: string) => boolean, userProfile?: any): MenuItem[] => {
  const baseItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home' },
  ];

  const potentialItems = [
    { id: 'user-admin', label: 'User Management', icon: 'UserCog', adminOnly: true },
    { id: 'school-management', label: 'School Management', icon: 'Building2', adminOnly: true },
    { id: 'role-management', label: 'Role Management', icon: 'Shield', adminOnly: true },
    { id: 'cadets', label: 'Cadets', icon: 'User' },
    { id: 'tasks', label: 'Cadet Tasks', icon: 'CheckSquare' },
    { id: 'incident_management', label: 'Get Help', icon: 'AlertTriangle' },
    { id: 'job-board', label: 'Chain of Command', icon: 'Briefcase' },
    { id: 'teams', label: 'Teams', icon: 'Users' },
    { id: 'budget', label: 'Budget', icon: 'DollarSign' },
    { id: 'inventory', label: 'Inventory', icon: 'Package' },
    { id: 'contacts', label: 'Contacts', icon: 'Contact' },
    { id: 'calendar', label: 'Calendar', icon: 'Calendar' },
    { id: 'competitions', label: 'My Competitions', icon: 'Trophy' },
    { id: 'email-management', label: 'Email', icon: 'Mails' },
    { id: 'settings', label: 'Settings', icon: 'Settings' },
  ];

  const allowedItems = potentialItems.filter(item => {
    // Admin-only items
    if (item.adminOnly && role !== 'admin') {
      return false;
    }

    // Special cases for admin items
    if (item.adminOnly && role === 'admin') {
      return true;
    }

    // Settings is only available to admins
    if (item.id === 'settings') {
      return role === 'admin';
    }

    // Special case for competitions - requires permission and competition module
    if (item.id === 'competitions') {
      const moduleKey = MODULE_MAPPING[item.id];
      const hasModulePermission = moduleKey && hasPermission(moduleKey, 'sidebar');
      const hasCompetitionModule = userProfile?.schools?.competition_module === true;    
      return hasModulePermission && hasCompetitionModule;
    }

    // Check permissions for regular items
    const moduleKey = MODULE_MAPPING[item.id];
    if (moduleKey) {
      return hasPermission(moduleKey, 'sidebar');
    }

    return false;
  });

  return [...baseItems, ...allowedItems];
};

// Fallback function for when permissions aren't loaded yet
const getDefaultMenuItemsForRole = (role: string, userProfile?: any): MenuItem[] => {
  const baseItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home' },
  ];
  
  const hasCompetitionModule = userProfile?.schools?.competition_module === true;
  const hasCompetitionPortal = userProfile?.schools?.competition_portal === true;

  switch (role) {
    case 'admin':
      return [
        ...baseItems,
        { id: 'user-admin', label: 'User Management', icon: 'UserCog' },
        { id: 'school-management', label: 'School Management', icon: 'Building2' },
        { id: 'role-management', label: 'Role Management', icon: 'Shield' },
        { id: 'tasks', label: 'Cadet Tasks', icon: 'CheckSquare' },
        { id: 'incident_management', label: 'Incidents', icon: 'AlertTriangle' },
        { id: 'email-management', label: 'Email', icon: 'Mails' },
        ...(hasCompetitionModule ? [{ id: 'competitions', label: 'My Competitions', icon: 'Trophy' }] : []),
        { id: 'settings', label: 'Settings', icon: 'Settings' },
      ];
    
    case 'instructor':
      return [
        ...baseItems,
        { id: 'cadets', label: 'Cadets', icon: 'User' },
        { id: 'job-board', label: 'Chain of Command', icon: 'Briefcase' },
        { id: 'teams', label: 'Teams', icon: 'Users' },
        { id: 'tasks', label: 'Cadet Tasks', icon: 'CheckSquare' },
        { id: 'budget', label: 'Budget', icon: 'DollarSign' },
        { id: 'inventory', label: 'Inventory', icon: 'Package' },
        { id: 'contacts', label: 'Contacts', icon: 'Contact' },
        ...(hasCompetitionModule ? [{ id: 'competitions', label: 'My Competitions', icon: 'Trophy' }] : []),
        { id: 'calendar', label: 'Calendar', icon: 'Calendar' },
        { id: 'email-management', label: 'Email', icon: 'Mails' },
        { id: 'incident_management', label: 'Get Help', icon: 'AlertTriangle' },
      ];
    
    case 'command_staff':
      return [
        ...baseItems,
        { id: 'cadets', label: 'Cadets', icon: 'User' },
        { id: 'tasks', label: 'Cadet Tasks', icon: 'CheckSquare' },
        { id: 'job-board', label: 'Chain of Command', icon: 'Briefcase' },
        { id: 'inventory', label: 'Inventory', icon: 'Package' },
        { id: 'calendar', label: 'Calendar', icon: 'Calendar' },
        ...(hasCompetitionModule ? [{ id: 'competitions', label: 'My Competitions', icon: 'Trophy' }] : []),
      ];
    
    case 'cadet':
      return [
        ...baseItems,
        { id: 'tasks', label: 'Cadet Tasks', icon: 'CheckSquare' },
        { id: 'job-board', label: 'Chain of Command', icon: 'Briefcase' },
        { id: 'calendar', label: 'Calendar', icon: 'Calendar' },
        ...(hasCompetitionModule ? [{ id: 'competitions', label: 'My Competitions', icon: 'Trophy' }] : []),
      ];
    
    default:
      return baseItems;
  }
};

export const useSidebarPreferences = () => {
  const { userProfile } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = usePermissionContext();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize permission state to prevent unnecessary re-renders
  const permissionsLoaded = useMemo(() => !permissionsLoading, [permissionsLoading]);
  const userRole = useMemo(() => userProfile?.role || 'cadet', [userProfile?.role]);
  const userId = useMemo(() => userProfile?.id, [userProfile?.id]);

  // Debounced load function to prevent rapid successive calls
  const loadPreferences = useCallback(async () => {
    if (!userId) {
      console.log('No user profile found, skipping sidebar preferences load');
      return;
    }

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Debounce the actual loading
    loadingTimeoutRef.current = setTimeout(async () => {
      console.log('Loading sidebar preferences for user:', userId, 'role:', userRole);
      console.log('Permission system loaded:', permissionsLoaded);
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('user_sidebar_preferences')
          .select('menu_items')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading sidebar preferences:', error);
        }

        // Use database permissions if loaded, otherwise fallback to hardcoded
        const defaultItems = permissionsLoaded 
          ? getMenuItemsFromPermissions(userRole, hasPermission, userProfile)
          : getDefaultMenuItemsForRole(userRole, userProfile);
        
        console.log('Using', permissionsLoaded ? 'database permissions' : 'fallback permissions', 'for role:', userRole);
        
        if (data?.menu_items && Array.isArray(data.menu_items) && data.menu_items.length > 0) {
          console.log('Found saved preferences, filtering menu items');
          // Filter out invalid items and ensure all valid items are included
          const savedItemIds = data.menu_items;
          const orderedItems = savedItemIds
            .map(id => defaultItems.find(item => item.id === id))
            .filter(Boolean) as MenuItem[];
          
          setMenuItems(orderedItems);
        } else {
          console.log('No saved preferences, using default items');
          setMenuItems(defaultItems);
        }
      } catch (error) {
        console.error('Error loading sidebar preferences:', error);
        const fallbackItems = getDefaultMenuItemsForRole(userRole);
        setMenuItems(fallbackItems);
      } finally {
        console.log('Sidebar preferences loaded, setting loading to false');
        setIsLoading(false);
      }
    }, 100); // 100ms debounce
  }, [userId, userRole, permissionsLoaded, hasPermission]);

  const savePreferences = useCallback(async (newMenuItems: MenuItem[]) => {
    if (!userId) {
      console.error('No user profile found');
      return false;
    }

    try {
      const menuItemIds = newMenuItems.map(item => item.id);
      
      console.log('Saving sidebar preferences for user:', userId, 'with items:', menuItemIds);
      
      const { error } = await supabase
        .from('user_sidebar_preferences')
        .upsert({
          user_id: userId,
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
  }, [userId]);

  const resetToDefault = useCallback(async () => {
    if (!userId) return false;

    try {
      await supabase
        .from('user_sidebar_preferences')
        .delete()
        .eq('user_id', userId);

      const defaultItems = permissionsLoaded 
        ? getMenuItemsFromPermissions(userRole, hasPermission, userProfile)
        : getDefaultMenuItemsForRole(userRole, userProfile);
      setMenuItems(defaultItems);
      return true;
    } catch (error) {
      console.error('Error resetting sidebar preferences:', error);
      return false;
    }
  }, [userId, permissionsLoaded, userRole, hasPermission]);

  const refreshPreferences = useCallback(async () => {
    await loadPreferences();
  }, [loadPreferences]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const getDefaultMenuItems = useCallback(() => {
    return permissionsLoaded 
      ? getMenuItemsFromPermissions(userRole, hasPermission, userProfile)
      : getDefaultMenuItemsForRole(userRole, userProfile);
  }, [permissionsLoaded, userRole, hasPermission, userProfile]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  return {
    menuItems,
    isLoading,
    savePreferences,
    resetToDefault,
    refreshPreferences,
    getDefaultMenuItems,
  };
};