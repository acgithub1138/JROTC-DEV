import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { usePermissionContext } from './PermissionContext';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from 'use-debounce';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  isVisible: boolean;
  order: number;
}

interface SidebarPreferencesContextType {
  menuItems: MenuItem[];
  isLoading: boolean;
  savePreferences: (newMenuItems: MenuItem[]) => Promise<boolean>;
  resetToDefault: () => Promise<boolean>;
  refreshPreferences: () => Promise<void>;
  getDefaultMenuItems: MenuItem[];
}

const SidebarPreferencesContext = createContext<SidebarPreferencesContextType | undefined>(undefined);

export const useSidebarPreferencesContext = () => {
  const context = useContext(SidebarPreferencesContext);
  if (context === undefined) {
    throw new Error('useSidebarPreferencesContext must be used within a SidebarPreferencesProvider');
  }
  return context;
};

// Import the existing functions from the hook file
const getMenuItemsFromPermissions = (role: string, userProfile: any, hasPermission: (module: string, action: string) => boolean): MenuItem[] => {
  console.log('getMenuItemsFromPermissions called with role:', role, 'userProfile:', userProfile);
  
  const allMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/app/dashboard', isVisible: true, order: 1 },
    { id: 'tasks', label: 'Tasks', icon: 'CheckSquare', path: '/app/tasks', isVisible: true, order: 2 },
    { id: 'cadets', label: 'Cadets', icon: 'Users', path: '/app/cadets', isVisible: true, order: 3 },
    { id: 'job-board', label: 'Job Board', icon: 'Briefcase', path: '/app/job-board', isVisible: true, order: 4 },
    { id: 'teams', label: 'Teams', icon: 'Shield', path: '/app/teams', isVisible: true, order: 5 },
    { id: 'inventory', label: 'Inventory', icon: 'Package', path: '/app/inventory', isVisible: true, order: 6 },
    { id: 'budget', label: 'Budget', icon: 'DollarSign', path: '/app/budget', isVisible: true, order: 7 },
    { id: 'contacts', label: 'Contacts', icon: 'Users2', path: '/app/contacts', isVisible: true, order: 8 },
    { id: 'calendar', label: 'Calendar', icon: 'Calendar', path: '/app/calendar', isVisible: true, order: 9 },
    { id: 'incident_management', label: 'Incident Management', icon: 'AlertTriangle', path: '/app/incident-management', isVisible: true, order: 10 }
  ];

  // Special handling for admin and parent roles
  if (role === 'admin') {
    return allMenuItems.filter(item => item.isVisible);
  }

  if (role === 'parent') {
    return [
      { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/app/dashboard', isVisible: true, order: 1 },
      { id: 'tasks', label: 'My Cadets Tasks', icon: 'CheckSquare', path: '/app/tasks', isVisible: true, order: 2 },
      { id: 'calendar', label: 'Calendar', icon: 'Calendar', path: '/app/calendar', isVisible: true, order: 3 }
    ];
  }

  // For all other roles, check permissions
  const permissionMap: { [key: string]: string } = {
    'tasks': 'tasks',
    'cadets': 'cadets', 
    'job-board': 'job_board',
    'teams': 'teams',
    'inventory': 'inventory',
    'budget': 'budget',
    'contacts': 'contacts',
    'calendar': 'calendar',
    'incident_management': 'incident_management'
  };

  return allMenuItems.filter(item => {
    if (item.id === 'dashboard') return true; // Dashboard always visible
    
    const moduleKey = permissionMap[item.id];
    if (!moduleKey) return false;
    
    const hasAccess = hasPermission(moduleKey, 'sidebar');
    console.log(`Permission check: ${item.label} (${moduleKey}) -> sidebar = ${hasAccess}`);
    return hasAccess;
  });
};

const getDefaultMenuItemsForRole = (role: string, userProfile: any): MenuItem[] => {
  switch (role) {
    case 'admin':
      return [
        { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/app/dashboard', isVisible: true, order: 1 },
        { id: 'cadets', label: 'Cadets', icon: 'Users', path: '/app/cadets', isVisible: true, order: 2 },
        { id: 'teams', label: 'Teams', icon: 'Shield', path: '/app/teams', isVisible: true, order: 3 },
        { id: 'tasks', label: 'Tasks', icon: 'CheckSquare', path: '/app/tasks', isVisible: true, order: 4 },
        { id: 'budget', label: 'Budget', icon: 'DollarSign', path: '/app/budget', isVisible: true, order: 5 },
        { id: 'inventory', label: 'Inventory', icon: 'Package', path: '/app/inventory', isVisible: true, order: 6 },
        { id: 'contacts', label: 'Contacts', icon: 'Users2', path: '/app/contacts', isVisible: true, order: 7 },
        { id: 'calendar', label: 'Calendar', icon: 'Calendar', path: '/app/calendar', isVisible: true, order: 8 }
      ];
    case 'instructor':
      return [
        { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/app/dashboard', isVisible: true, order: 1 },
        { id: 'cadets', label: 'Cadets', icon: 'Users', path: '/app/cadets', isVisible: true, order: 2 },
        { id: 'teams', label: 'Teams', icon: 'Shield', path: '/app/teams', isVisible: true, order: 3 },
        { id: 'tasks', label: 'Tasks', icon: 'CheckSquare', path: '/app/tasks', isVisible: true, order: 4 },
        { id: 'budget', label: 'Budget', icon: 'DollarSign', path: '/app/budget', isVisible: true, order: 5 },
        { id: 'inventory', label: 'Inventory', icon: 'Package', path: '/app/inventory', isVisible: true, order: 6 },
        { id: 'contacts', label: 'Contacts', icon: 'Users2', path: '/app/contacts', isVisible: true, order: 7 },
        { id: 'calendar', label: 'Calendar', icon: 'Calendar', path: '/app/calendar', isVisible: true, order: 8 }
      ];
    case 'command_staff':
      return [
        { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/app/dashboard', isVisible: true, order: 1 },
        { id: 'cadets', label: 'Cadets', icon: 'Users', path: '/app/cadets', isVisible: true, order: 2 },
        { id: 'teams', label: 'Teams', icon: 'Shield', path: '/app/teams', isVisible: true, order: 3 },
        { id: 'tasks', label: 'Tasks', icon: 'CheckSquare', path: '/app/tasks', isVisible: true, order: 4 },
        { id: 'contacts', label: 'Contacts', icon: 'Users2', path: '/app/contacts', isVisible: true, order: 5 },
        { id: 'calendar', label: 'Calendar', icon: 'Calendar', path: '/app/calendar', isVisible: true, order: 6 }
      ];
    case 'cadet':
      return [
        { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/app/dashboard', isVisible: true, order: 1 },
        { id: 'tasks', label: 'Tasks', icon: 'CheckSquare', path: '/app/tasks', isVisible: true, order: 2 },
        { id: 'calendar', label: 'Calendar', icon: 'Calendar', path: '/app/calendar', isVisible: true, order: 3 }
      ];
    case 'parent':
      return [
        { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/app/dashboard', isVisible: true, order: 1 },
        { id: 'tasks', label: 'My Cadets Tasks', icon: 'CheckSquare', path: '/app/tasks', isVisible: true, order: 2 },
        { id: 'calendar', label: 'Calendar', icon: 'Calendar', path: '/app/calendar', isVisible: true, order: 3 }
      ];
    default:
      return [
        { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/app/dashboard', isVisible: true, order: 1 },
        { id: 'tasks', label: 'Tasks', icon: 'CheckSquare', path: '/app/tasks', isVisible: true, order: 2 },
        { id: 'calendar', label: 'Calendar', icon: 'Calendar', path: '/app/calendar', isVisible: true, order: 3 }
      ];
  }
};

export const SidebarPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = usePermissionContext();
  
  // Add debounced values to prevent excessive calls
  const [debouncedUserProfile] = useDebounce(userProfile, 500);
  const [debouncedPermissionsLoading] = useDebounce(permissionsLoading, 200);
  
  // Use refs to prevent duplicate loads and cache results
  const loadingRef = useRef<boolean>(false);
  const cacheRef = useRef<{ [key: string]: MenuItem[] }>({});
  const lastProfileRef = useRef<string>('');

  // Memoize derived values
  const permissionsLoaded = useMemo(() => !debouncedPermissionsLoading, [debouncedPermissionsLoading]);
  const userRole = useMemo(() => debouncedUserProfile?.role || 'cadet', [debouncedUserProfile?.role]);
  const userId = useMemo(() => debouncedUserProfile?.id, [debouncedUserProfile?.id]);

  const loadPreferences = useCallback(async () => {
    // Skip if no user profile ID available
    if (!debouncedUserProfile?.id) {
      console.log('SidebarPreferencesContext: Skipping load - no user profile ID');
      return;
    }

    // For admin users, don't wait for permissions since they bypass permission checks
    // For other users, wait for permissions to load
    const isAdmin = debouncedUserProfile.role === 'admin';
    if (!isAdmin && debouncedPermissionsLoading) {
      console.log('SidebarPreferencesContext: Skipping load - waiting for permissions (non-admin user):', {
        role: debouncedUserProfile.role,
        permissionsLoading: debouncedPermissionsLoading
      });
      return;
    }

    // Prevent duplicate loads and use cache
    const cacheKey = `${debouncedUserProfile.id}-${debouncedUserProfile.role}`;
    const profileKey = `${debouncedUserProfile.id}-${debouncedUserProfile.role}-${permissionsLoaded}`;
    
    console.log('SidebarPreferencesContext: Loading preferences for:', {
      userId: debouncedUserProfile.id,
      role: debouncedUserProfile.role,
      cacheKey,
      profileKey,
      isLoading: loadingRef.current,
      lastProfileKey: lastProfileRef.current,
      permissionsLoaded
    });
    
    if (loadingRef.current) {
      console.log('SidebarPreferencesContext: Skipping - already loading');
      return;
    }

    // Check cache first, but only if we've processed this exact state before
    if (cacheRef.current[cacheKey] && lastProfileRef.current === profileKey) {
      console.log('SidebarPreferencesContext: Using cached items:', cacheRef.current[cacheKey]);
      setMenuItems(cacheRef.current[cacheKey]);
      setIsLoading(false);
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);

    try {
      // Use database permissions if loaded, otherwise fallback to hardcoded
      const defaultItems = permissionsLoaded 
        ? getMenuItemsFromPermissions(userRole, debouncedUserProfile, hasPermission)
        : getDefaultMenuItemsForRole(userRole, debouncedUserProfile);
      
      console.log('SidebarPreferencesContext: Generated default items:', {
        role: userRole,
        permissionsLoaded,
        itemCount: defaultItems.length,
        items: defaultItems
      });

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
          
          console.log('SidebarPreferencesContext: Using saved preferences:', {
            savedItemIds: savedItems,
            validatedCount: validatedItems.length,
            validatedItems
          });
          setMenuItems(validatedItems);
          cacheRef.current[cacheKey] = validatedItems;
        } else {
          // No saved preferences - generate from permissions
          console.log('SidebarPreferencesContext: No saved preferences, using defaults:', defaultItems);
          setMenuItems(defaultItems);
          cacheRef.current[cacheKey] = defaultItems;
        }
      } catch (prefsError) {
        console.warn('SidebarPreferencesContext: Failed to load preferences, using defaults:', prefsError);
        setMenuItems(defaultItems);
        cacheRef.current[cacheKey] = defaultItems;
      }

      lastProfileRef.current = profileKey;
    } catch (error) {
      console.error('SidebarPreferencesContext: Error in loadPreferences:', error);
      // Fall back to default permissions-based menu
      const fallbackItems = getDefaultMenuItemsForRole(userRole, debouncedUserProfile);
      console.log('SidebarPreferencesContext: Using fallback items:', fallbackItems);
      setMenuItems(fallbackItems);
      cacheRef.current[cacheKey] = fallbackItems;
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [debouncedUserProfile?.id, debouncedUserProfile?.role, debouncedPermissionsLoading, hasPermission, permissionsLoaded, userRole, userId]);

  // Load preferences when user profile changes or permissions finish loading
  // Also trigger when the actual userProfile (not debounced) changes to handle timing issues
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Additional effect to retry loading when userProfile becomes available
  // This handles cases where debounced values cause timing issues
  useEffect(() => {
    if (userProfile?.id && !isLoading && menuItems.length === 0) {
      console.log('SidebarPreferencesContext: Retrying load after user profile became available');
      loadPreferences();
    }
  }, [userProfile?.id, userProfile?.role, isLoading, menuItems.length, loadPreferences]);

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
      
      // Update cache
      const cacheKey = `${debouncedUserProfile?.id}-${debouncedUserProfile?.role}`;
      cacheRef.current[cacheKey] = newMenuItems;
      
      return true;
    } catch (error) {
      console.error('Exception while saving sidebar preferences:', error);
      return false;
    }
  }, [userId, debouncedUserProfile?.id, debouncedUserProfile?.role]);

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
      
      // Update cache
      const cacheKey = `${debouncedUserProfile?.id}-${debouncedUserProfile?.role}`;
      cacheRef.current[cacheKey] = defaultItems;
      
      return true;
    } catch (error) {
      console.error('Error resetting sidebar preferences:', error);
      return false;
    }
  }, [userId, permissionsLoaded, userRole, hasPermission, debouncedUserProfile]);

  const refreshPreferences = useCallback(async () => {
    // Clear cache and reload
    cacheRef.current = {};
    lastProfileRef.current = '';
    await loadPreferences();
  }, [loadPreferences]);

  const getDefaultMenuItems = useMemo(() => {
    if (!debouncedUserProfile) return [];
    return permissionsLoaded 
      ? getMenuItemsFromPermissions(debouncedUserProfile.role, debouncedUserProfile, hasPermission)
      : getDefaultMenuItemsForRole(debouncedUserProfile.role, debouncedUserProfile);
  }, [debouncedUserProfile?.role, debouncedUserProfile?.id, hasPermission, permissionsLoaded]);

  const value: SidebarPreferencesContextType = {
    menuItems,
    isLoading,
    savePreferences,
    resetToDefault,
    refreshPreferences,
    getDefaultMenuItems,
  };

  return (
    <SidebarPreferencesContext.Provider value={value}>
      {children}
    </SidebarPreferencesContext.Provider>
  );
};