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
    // Always include dashboard as the first item
    const dashboardItem: MenuItem = {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'LayoutDashboard',
      path: '/app/dashboard',
      isVisible: true,
      order: 1
    };

    // Try to query permission_modules table directly
    let modules: any[] = [];
    
    try {
      const { data: moduleResult, error } = await supabase
        .from('permission_modules')
        .select('id, name, label, path')
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (!error && moduleResult) {
        modules = moduleResult;
        console.log('Loaded modules from database:', modules);
      }
    } catch (tableError) {
      console.log('permission_modules table not available, using fallback');
    }

    // Comprehensive fallback modules if database query fails
    if (modules.length === 0) {
      modules = [
        { name: 'tasks', label: 'Tasks', path: '/app/tasks' },
        { name: 'cadets', label: 'Cadets', path: '/app/cadets' },
        { name: 'job_board', label: 'Job Board', path: '/app/job-board' },
        { name: 'teams', label: 'Teams', path: '/app/teams' },
        { name: 'inventory', label: 'Inventory', path: '/app/inventory' },
        { name: 'budget', label: 'Budget', path: '/app/budget' },
        { name: 'contacts', label: 'Contacts', path: '/app/contacts' },
        { name: 'calendar', label: 'Calendar', path: '/app/calendar' },
        { name: 'incident_management', label: 'Get Help', path: '/app/incidents' },
        { name: 'email', label: 'Email Management', path: '/app/email' },
        { name: 'user_admin', label: 'User Management', path: '/app/users' },
        { name: 'school_admin', label: 'School Management', path: '/app/school' },
        { name: 'role_management', label: 'Role Management', path: '/app/roles' },
        { name: 'settings', label: 'Settings', path: '/app/settings' }
      ];
      console.log('Using fallback modules:', modules);
    }

    // Comprehensive icon mapping
    const iconMap: { [key: string]: string } = {
      'dashboard': 'LayoutDashboard',
      'tasks': 'CheckSquare',
      'cadets': 'Users',
      'job_board': 'Briefcase',
      'teams': 'Users',
      'inventory': 'Package',
      'budget': 'DollarSign',
      'contacts': 'Users2',
      'calendar': 'Calendar',
      
      'incident_management': 'AlertTriangle',
      'email': 'Mails',
      'user_admin': 'UserCog',
      'school_management': 'Building2',
      'role_management': 'Shield',
      'settings': 'Settings'
    };


    // Generate menu items dynamically from modules
    const menuItems: MenuItem[] = [dashboardItem];
    
    for (const module of modules) {
      // Skip dashboard and competition portal modules since dashboard is already added
      if (module.name === 'dashboard' || module.path?.startsWith('/app/competition-portal')) continue;
      
      // Check if user has sidebar permission for this module
      const hasSidebarPermission = hasPermission(module.name, 'sidebar');
      
      if (hasSidebarPermission) {
        menuItems.push({
          id: module.name,
          label: module.label || module.name,
          icon: iconMap[module.name] || 'Circle',
          path: module.path || `/app/${module.name}`,
          isVisible: true,
          order: menuItems.length + 1
        });
      }
    }
    console.log('Generated menu items:', menuItems.map(item => `${item.id}: ${item.isVisible}`));
    return menuItems;
  } catch (error) {
    console.error('Exception in fetchMenuItemsFromDatabase:', error);
    // Fallback to just dashboard
    return [{
      id: 'dashboard',
      label: 'Dashboard', 
      icon: 'LayoutDashboard',
      path: '/app/dashboard',
      isVisible: true,
      order: 1
    }];
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

    // Wait for permissions to load for all users
    if (debouncedPermissionsLoading) {
      console.log('SidebarPreferencesContext: Skipping load - waiting for permissions:', {
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
      // Use database-driven permissions
      const defaultItems = await fetchMenuItemsFromDatabase(debouncedUserProfile, hasPermission);
      
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
      // Fall back to minimal dashboard item
      const fallbackItems = [{
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'LayoutDashboard',
        path: '/app/dashboard',
        isVisible: true,
        order: 1
      }];
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