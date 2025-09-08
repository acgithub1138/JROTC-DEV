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
  'email-management': 'email',
  'user-admin': 'user_admin',
  'school-management': 'school_management',
  'role-management': 'role_management',
  'settings': 'settings'
};

// Database-driven menu items function
const fetchMenuItemsFromDatabase = async (userProfile: any, hasPermission: (module: string, action: string) => boolean): Promise<MenuItem[]> => {
  try {
    // Check if user has dashboard sidebar permission
    const hasDashboardPermission = hasPermission('dashboard', 'sidebar');
    
    const dashboardItem: MenuItem = {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'LayoutDashboard',
      path: '/app/dashboard',
      isVisible: hasDashboardPermission,
      order: 1
    };

    // Try to query permission_modules table directly
    let modules: any[] = [];
    
    try {
      const { data: moduleResult, error } = await supabase
        .from('permission_modules')
        .select('id, name, label, path, icon, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && moduleResult) {
        modules = moduleResult;
      }
    } catch (tableError) {
      // Fallback to hardcoded modules if table not available
    }

    // Comprehensive fallback modules if database query fails
    if (modules.length === 0) {
      modules = [
        { name: 'tasks', label: 'Tasks', path: '/app/tasks', icon: 'CheckSquare' },
        { name: 'cadets', label: 'Cadets', path: '/app/cadets', icon: 'Users' },
        { name: 'job_board', label: 'Job Board', path: '/app/job-board', icon: 'Briefcase' },
        { name: 'teams', label: 'Teams', path: '/app/teams', icon: 'Users' },
        { name: 'inventory', label: 'Inventory', path: '/app/inventory', icon: 'Package' },
        { name: 'budget', label: 'Budget', path: '/app/budget', icon: 'DollarSign' },
        { name: 'contacts', label: 'Contacts', path: '/app/contacts', icon: 'Users2' },
        { name: 'calendar', label: 'Calendar', path: '/app/calendar', icon: 'Calendar' },
        { name: 'incident_management', label: 'Get Help', path: '/app/incidents', icon: 'AlertTriangle' },
        { name: 'email', label: 'Email Management', path: '/app/email', icon: 'Mails' },
        { name: 'user_admin', label: 'User Management', path: '/app/users', icon: 'UserCog' },
        { name: 'school_admin', label: 'School Management', path: '/app/school', icon: 'Building2' },
        { name: 'role_management', label: 'Role Management', path: '/app/roles', icon: 'Shield' },
        { name: 'settings', label: 'Settings', path: '/app/settings', icon: 'Settings' }
      ];
    }

    // Generate menu items dynamically from modules
    const menuItems: MenuItem[] = [];
    
    // Add dashboard only if user has permission
    if (hasDashboardPermission) {
      menuItems.push(dashboardItem);
    }
    
    for (const module of modules) {
      // Skip dashboard and competition portal modules since dashboard is already added
      if (module.name === 'dashboard' || module.path?.startsWith('/app/competition-portal')) continue;
      
      // Check if user has sidebar permission for this module
      const hasSidebarPermission = hasPermission(module.name, 'sidebar');
      
      if (hasSidebarPermission) {
        menuItems.push({
          id: module.name,
          label: module.label || module.name,
          icon: module.icon || 'Circle',
          path: module.path || `/app/${module.name}`,
          isVisible: true,
          order: menuItems.length + 1
        });
      }
    }
    return menuItems;
  } catch (error) {
    console.error('Exception in fetchMenuItemsFromDatabase:', error);
    // Fallback to dashboard only if user has permission
    const hasDashboardPermission = hasPermission('dashboard', 'sidebar');
    return hasDashboardPermission ? [{
      id: 'dashboard',
      label: 'Dashboard', 
      icon: 'LayoutDashboard',
      path: '/app/dashboard',
      isVisible: true,
      order: 1
    }] : [];
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
      return;
    }

    // Wait for permissions to load for all users
    if (debouncedPermissionsLoading) {
      return;
    }

    // Prevent duplicate loads and use cache
    const cacheKey = `${debouncedUserProfile.id}-${debouncedUserProfile.role}`;
    const profileKey = `${debouncedUserProfile.id}-${debouncedUserProfile.role}-${permissionsLoaded}`;
    
    if (loadingRef.current) {
      return;
    }

    // Check cache first, but only if we've processed this exact state before
    if (cacheRef.current[cacheKey] && lastProfileRef.current === profileKey) {
      setMenuItems(cacheRef.current[cacheKey]);
      setIsLoading(false);
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);

    try {
      // Use database-driven permissions
      const defaultItems = await fetchMenuItemsFromDatabase(debouncedUserProfile, hasPermission);

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
        setMenuItems(defaultItems);
        cacheRef.current[cacheKey] = defaultItems;
      }

      lastProfileRef.current = profileKey;
    } catch (error) {
      console.error('SidebarPreferencesContext: Error in loadPreferences:', error);
      // Fall back to dashboard item only if user has permission
      const hasDashboardPermission = hasPermission('dashboard', 'sidebar');
      const fallbackItems = hasDashboardPermission ? [{
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'LayoutDashboard',
        path: '/app/dashboard',
        isVisible: true,
        order: 1
      }] : [];
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

      // Use database-driven function to get default items
      const defaultItems = await fetchMenuItemsFromDatabase(debouncedUserProfile, hasPermission);
      setMenuItems(defaultItems);
      
      // Update cache
      const cacheKey = `${debouncedUserProfile?.id}-${debouncedUserProfile?.role}`;
      cacheRef.current[cacheKey] = defaultItems;
      
      return true;
    } catch (error) {
      console.error('Error resetting sidebar preferences:', error);
      return false;
    }
  }, [userId, hasPermission, debouncedUserProfile]);

  const refreshPreferences = useCallback(async () => {
    // Clear cache and reload
    cacheRef.current = {};
    lastProfileRef.current = '';
    await loadPreferences();
  }, [loadPreferences]);

  const getDefaultMenuItems = useMemo(() => {
    // Since we moved to database-driven approach, return current menu items
    // This maintains compatibility with existing code
    return menuItems;
  }, [menuItems]);

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