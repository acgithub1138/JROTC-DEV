import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionContext } from '@/contexts/PermissionContext';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from 'use-debounce';
import { useDeepCompareEffect } from '@/hooks/useDeepCompareEffect';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  isVisible: boolean;
  order: number;
}

// Helper mapping for module name compatibility
const MODULE_MAPPING: { [key: string]: string } = {
  'tasks': 'tasks',
  'incident_management': 'incident_management',
  'cadets': 'cadets',
  'job-board': 'job_board',
  'teams': 'teams', 
  'inventory': 'inventory',
  'budget': 'budget',
  'contacts': 'contacts',
  'calendar': 'calendar',
  'competitions': 'competitions'
};

// Generate menu items from current permissions
const getMenuItemsFromPermissions = (
  role: string, 
  userProfile: any,
  hasPermission: (module: string, action: string) => boolean
): MenuItem[] => {
  console.log('getMenuItemsFromPermissions called with role:', role, 'userProfile:', userProfile);
  
  const baseItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'LayoutDashboard',
      path: '/app',
      isVisible: true,
      order: 1
    }
  ];

  // Special handling for admin role - admins should have access to everything
  if (role === 'admin') {
    console.log('Admin detected, granting full access');
    return [
      ...baseItems,
      { id: 'tasks', label: 'Tasks', icon: 'CheckSquare', path: '/app/tasks', isVisible: true, order: 2 },
      { id: 'cadets', label: 'Cadets', icon: 'Users', path: '/app/cadets', isVisible: true, order: 3 },
      { id: 'job-board', label: 'Job Board', icon: 'Briefcase', path: '/app/job-board', isVisible: true, order: 4 },
      { id: 'teams', label: 'Teams', icon: 'Users', path: '/app/teams', isVisible: true, order: 5 },
      { id: 'inventory', label: 'Inventory', icon: 'Package', path: '/app/inventory', isVisible: true, order: 6 },
      { id: 'budget', label: 'Budget', icon: 'DollarSign', path: '/app/budget', isVisible: true, order: 7 },
      { id: 'contacts', label: 'Contacts', icon: 'Users', path: '/app/contacts', isVisible: true, order: 8 },
      { id: 'calendar', label: 'Calendar', icon: 'Calendar', path: '/app/calendar', isVisible: true, order: 9 },
      { id: 'competitions', label: 'Competitions', icon: 'Trophy', path: '/app/competitions', isVisible: true, order: 10 },
      { id: 'incident_management', label: 'Incidents', icon: 'AlertTriangle', path: '/app/incidents', isVisible: true, order: 11 }
    ];
  }

  const allPossibleItems: MenuItem[] = [
    {
      id: 'tasks',
      label: 'Tasks',
      icon: 'CheckSquare',
      path: '/app/tasks',
      isVisible: hasPermission('tasks', 'sidebar'),
      order: 2
    },
    {
      id: 'cadets',
      label: 'Cadets',
      icon: 'Users',
      path: '/app/cadets',
      isVisible: hasPermission('cadets', 'sidebar'),
      order: 3
    },
    {
      id: 'job-board',
      label: 'Job Board',
      icon: 'Briefcase',
      path: '/app/job-board',
      isVisible: hasPermission('job_board', 'sidebar'),
      order: 4
    },
    {
      id: 'teams',
      label: 'Teams',
      icon: 'Users',
      path: '/app/teams',
      isVisible: hasPermission('teams', 'sidebar'),
      order: 5
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: 'Package',
      path: '/app/inventory',
      isVisible: hasPermission('inventory', 'sidebar'),
      order: 6
    },
    {
      id: 'budget',
      label: 'Budget',
      icon: 'DollarSign',
      path: '/app/budget',
      isVisible: hasPermission('budget', 'sidebar'),
      order: 7
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: 'Users',
      path: '/app/contacts',
      isVisible: hasPermission('contacts', 'sidebar'),
      order: 8
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: 'Calendar',
      path: '/app/calendar',
      isVisible: hasPermission('calendar', 'sidebar'),
      order: 9
    },
    {
      id: 'competitions',
      label: 'Competitions',
      icon: 'Trophy',
      path: '/app/competitions',
      isVisible: hasPermission('competitions', 'sidebar'),
      order: 10
    },
    {
      id: 'incident_management',
      label: 'Incidents',
      icon: 'AlertTriangle',
      path: '/app/incidents',
      isVisible: hasPermission('incident_management', 'sidebar'),
      order: 11
    }
  ];

  // Log permission checks for debugging
  allPossibleItems.forEach(item => {
    const moduleKey = MODULE_MAPPING[item.id] || item.id;
    const hasAccess = hasPermission(moduleKey, 'sidebar');
    console.log(`Permission check: ${item.id} (${moduleKey}) -> sidebar = ${hasAccess}`);
  });

  // Special handling for parent role - only allow calendar and contacts
  if (role === 'parent') {
    const parentItems = allPossibleItems.filter(item => 
      item.id === 'calendar' || item.id === 'contacts'
    ).map(item => ({ ...item, isVisible: true }));
    return [...baseItems, ...parentItems];
  }

  const visibleItems = allPossibleItems.filter(item => item.isVisible);
  console.log('Final visible items for role', role, ':', visibleItems.map(i => i.id));
  
  return [...baseItems, ...visibleItems];
};

// Fallback menu items for when permission system isn't loaded
const getDefaultMenuItemsForRole = (role: string, userProfile?: any): MenuItem[] => {
  const baseItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard', 
      icon: 'LayoutDashboard',
      path: '/app',
      isVisible: true,
      order: 1
    }
  ];

  if (role === 'admin') {
    return [
      ...baseItems,
      { id: 'tasks', label: 'Tasks', icon: 'CheckSquare', path: '/app/tasks', isVisible: true, order: 2 },
      { id: 'cadets', label: 'Cadets', icon: 'Users', path: '/app/cadets', isVisible: true, order: 3 },
      { id: 'job-board', label: 'Job Board', icon: 'Briefcase', path: '/app/job-board', isVisible: true, order: 4 },
      { id: 'teams', label: 'Teams', icon: 'Users', path: '/app/teams', isVisible: true, order: 5 },
      { id: 'inventory', label: 'Inventory', icon: 'Package', path: '/app/inventory', isVisible: true, order: 6 },
      { id: 'budget', label: 'Budget', icon: 'DollarSign', path: '/app/budget', isVisible: true, order: 7 },
      { id: 'contacts', label: 'Contacts', icon: 'Users', path: '/app/contacts', isVisible: true, order: 8 },
      { id: 'calendar', label: 'Calendar', icon: 'Calendar', path: '/app/calendar', isVisible: true, order: 9 },
      { id: 'competitions', label: 'Competitions', icon: 'Trophy', path: '/app/competitions', isVisible: true, order: 10 },
      { id: 'incident_management', label: 'Incidents', icon: 'AlertTriangle', path: '/app/incidents', isVisible: true, order: 11 }
    ];
  } else if (role === 'parent') {
    return [
      ...baseItems,
      { id: 'calendar', label: 'Calendar', icon: 'Calendar', path: '/app/calendar', isVisible: true, order: 2 },
      { id: 'contacts', label: 'Contacts', icon: 'Users', path: '/app/contacts', isVisible: true, order: 3 }
    ];
  } else if (role === 'instructor') {
    return [
      ...baseItems,
      { id: 'tasks', label: 'Tasks', icon: 'CheckSquare', path: '/app/tasks', isVisible: true, order: 2 },
      { id: 'cadets', label: 'Cadets', icon: 'Users', path: '/app/cadets', isVisible: true, order: 3 },
      { id: 'calendar', label: 'Calendar', icon: 'Calendar', path: '/app/calendar', isVisible: true, order: 4 },
      { id: 'competitions', label: 'Competitions', icon: 'Trophy', path: '/app/competitions', isVisible: true, order: 5 },
      { id: 'incident_management', label: 'Incidents', icon: 'AlertTriangle', path: '/app/incidents', isVisible: true, order: 6 }
    ];
  } else {
    // Default cadet items
    return [
      ...baseItems,
      { id: 'tasks', label: 'Tasks', icon: 'CheckSquare', path: '/app/tasks', isVisible: true, order: 2 },
      { id: 'calendar', label: 'Calendar', icon: 'Calendar', path: '/app/calendar', isVisible: true, order: 3 }
    ];
  }
};

export const useSidebarPreferences = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = usePermissionContext();
  
  // Add debounced values to prevent excessive calls
  const [debouncedUserProfile] = useDebounce(userProfile, 1000);
  const [debouncedPermissionsLoading] = useDebounce(permissionsLoading, 500);
  
  // Use refs to prevent duplicate loads and cache results
  const loadingRef = useRef<boolean>(false);
  const cacheRef = useRef<{ [key: string]: MenuItem[] }>({});
  const lastProfileRef = useRef<string>('');
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize derived values
  const permissionsLoaded = useMemo(() => !debouncedPermissionsLoading, [debouncedPermissionsLoading]);
  const userRole = useMemo(() => debouncedUserProfile?.role || 'cadet', [debouncedUserProfile?.role]);
  const userId = useMemo(() => debouncedUserProfile?.id, [debouncedUserProfile?.id]);

  const loadPreferences = useCallback(async () => {
    if (!debouncedUserProfile?.id || debouncedPermissionsLoading) {
      return;
    }

    // Prevent duplicate loads and use cache
    const cacheKey = `${debouncedUserProfile.id}-${debouncedUserProfile.role}`;
    const profileKey = `${debouncedUserProfile.id}-${debouncedUserProfile.role}-${Date.now()}`;
    
    if (loadingRef.current || lastProfileRef.current === profileKey) {
      return;
    }

    // Check cache first
    if (cacheRef.current[cacheKey]) {
      setMenuItems(cacheRef.current[cacheKey]);
      setIsLoading(false);
      lastProfileRef.current = profileKey;
      return;
    }

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Debounce the actual loading
    loadingTimeoutRef.current = setTimeout(async () => {
      loadingRef.current = true;
      setIsLoading(true);

      try {
        // Use database permissions if loaded, otherwise fallback to hardcoded
        const defaultItems = permissionsLoaded 
          ? getMenuItemsFromPermissions(userRole, debouncedUserProfile, hasPermission)
          : getDefaultMenuItemsForRole(userRole, debouncedUserProfile);

        // Try to load saved preferences
        try {
          const { data: preferences, error } = await supabase
            .from('user_sidebar_preferences')
            .select('menu_items')
            .eq('user_id', userId)
            .maybeSingle();

          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching sidebar preferences:', error);
            // Fall back to default permissions-based menu
            setMenuItems(defaultItems);
            cacheRef.current[cacheKey] = defaultItems;
            return;
          }

          if (preferences?.menu_items && Array.isArray(preferences.menu_items)) {
            // User has saved preferences - validate they still have permissions
            const savedItems = preferences.menu_items as string[];
            const validatedItems = savedItems
              .map(id => defaultItems.find(item => item.id === id))
              .filter(Boolean) as MenuItem[];
            
            setMenuItems(validatedItems);
            cacheRef.current[cacheKey] = validatedItems;
          } else {
            // No saved preferences - generate from permissions
            setMenuItems(defaultItems);
            cacheRef.current[cacheKey] = defaultItems;
          }
        } catch (prefsError) {
          console.warn('Failed to load preferences, using defaults:', prefsError);
          setMenuItems(defaultItems);
          cacheRef.current[cacheKey] = defaultItems;
        }

        lastProfileRef.current = profileKey;
      } catch (error) {
        console.error('Error in loadPreferences:', error);
        // Fall back to default permissions-based menu
        const fallbackItems = getDefaultMenuItemsForRole(userRole, debouncedUserProfile);
        setMenuItems(fallbackItems);
        cacheRef.current[cacheKey] = fallbackItems;
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    }, 200);
  }, [debouncedUserProfile?.id, debouncedUserProfile?.role, debouncedPermissionsLoading, hasPermission, permissionsLoaded, userRole, userId]);

  // Load preferences when user profile changes or permissions finish loading  
  useDeepCompareEffect(() => {
    loadPreferences();
  }, [debouncedUserProfile?.id, debouncedUserProfile?.role, debouncedPermissionsLoading]);

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
        ? getMenuItemsFromPermissions(userRole, debouncedUserProfile, hasPermission)
        : getDefaultMenuItemsForRole(userRole, debouncedUserProfile);
      setMenuItems(defaultItems);
      return true;
    } catch (error) {
      console.error('Error resetting sidebar preferences:', error);
      return false;
    }
  }, [userId, permissionsLoaded, userRole, hasPermission, debouncedUserProfile]);

  const refreshPreferences = useCallback(async () => {
    await loadPreferences();
  }, [loadPreferences]);

  const getDefaultMenuItems = useMemo(() => {
    if (!debouncedUserProfile) return [];
    return permissionsLoaded 
      ? getMenuItemsFromPermissions(debouncedUserProfile.role, debouncedUserProfile, hasPermission)
      : getDefaultMenuItemsForRole(debouncedUserProfile.role, debouncedUserProfile);
  }, [debouncedUserProfile?.role, debouncedUserProfile?.id, hasPermission, permissionsLoaded]);

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