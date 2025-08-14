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
  'email-management': 'email',
  'incident_management': 'incident_management',
  'role-management': 'cadets', // Only admins should see this
};

const getMenuItemsFromPermissions = (role: string, hasPermission: (module: string, action: string) => boolean, userProfile?: any): MenuItem[] => {
  console.log('getMenuItemsFromPermissions called with role:', role, 'userProfile:', userProfile);
  
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
    { id: 'email-management', label: 'Email', icon: 'Mails' },
    { id: 'settings', label: 'Settings', icon: 'Settings' },
  ];

  const allowedItems = potentialItems.filter(item => {
    console.log(`Checking permissions for item: ${item.id}`);
    
    // Admin-only items
    if (item.adminOnly && role !== 'admin') {
      console.log(`  - Skipped ${item.id}: admin-only and role is ${role}`);
      return false;
    }

    // Special cases for admin items
    if (item.adminOnly && role === 'admin') {
      console.log(`  - Allowed ${item.id}: admin-only and role is admin`);
      return true;
    }

    // Settings is only available to admins
    if (item.id === 'settings') {
      const allowed = role === 'admin';
      console.log(`  - Settings: allowed=${allowed} (role=${role})`);
      return allowed;
    }

    // Special case for competitions - requires permission and competition module
    if (item.id === 'competitions') {
      const moduleKey = MODULE_MAPPING[item.id];
      const hasModulePermission = moduleKey && hasPermission(moduleKey, 'sidebar');
      const hasCompetitionModule = userProfile?.schools?.competition_module === true;
      console.log(`  - Competitions: moduleKey=${moduleKey}, hasModulePermission=${hasModulePermission}, hasCompetitionModule=${hasCompetitionModule}`);
      return hasModulePermission && hasCompetitionModule;
    }

    // Check permissions for regular items
    const moduleKey = MODULE_MAPPING[item.id];
    if (moduleKey) {
      const allowed = hasPermission(moduleKey, 'sidebar');
      console.log(`  - ${item.id}: moduleKey=${moduleKey}, allowed=${allowed}`);
      return allowed;
    }

    console.log(`  - ${item.id}: no module mapping, skipped`);
    return false;
  });

  console.log('Final allowed items:', allowedItems.map(item => item.id));
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
      ];
    
    case 'cadet':
      return [
        ...baseItems,
        { id: 'tasks', label: 'Cadet Tasks', icon: 'CheckSquare' },
        { id: 'job-board', label: 'Chain of Command', icon: 'Briefcase' },
        { id: 'calendar', label: 'Calendar', icon: 'Calendar' },
      ];
    
    default:
      return baseItems;
  }
};

// Create a global cache to prevent multiple instances from loading simultaneously
const sidebarCache = new Map<string, {
  menuItems: MenuItem[];
  isLoading: boolean;
  timestamp: number;
}>();

export const useSidebarPreferences = () => {
  const { userProfile } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = usePermissionContext();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);

  // Memoize permission state to prevent unnecessary re-renders
  const permissionsLoaded = useMemo(() => !permissionsLoading, [permissionsLoading]);
  const userRole = useMemo(() => userProfile?.role || 'cadet', [userProfile?.role]);
  const userId = useMemo(() => userProfile?.id, [userProfile?.id]);
  const cacheKey = useMemo(() => `${userId}-${userRole}-${permissionsLoaded}`, [userId, userRole, permissionsLoaded]);

  // Debounced load function to prevent rapid successive calls
  const loadPreferences = useCallback(async () => {
    if (!userId) {
      console.log('No user ID found, using default fallback items for role:', userRole);
      // Still provide default items even without userId
      const fallbackItems = getDefaultMenuItemsForRole(userRole, userProfile);
      setMenuItems(fallbackItems);
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cached = sidebarCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 5000) { // Cache for 5 seconds
      console.log('Using cached sidebar preferences');
      setMenuItems(cached.menuItems);
      setIsLoading(cached.isLoading);
      return;
    }

    // Only proceed if this is the first instance loading or cache is expired
    if (hasInitialized.current && cached) {
      return;
    }
    hasInitialized.current = true;

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Debounce the actual loading
    loadingTimeoutRef.current = setTimeout(async () => {
      console.log('Loading sidebar preferences for user:', userId, 'role:', userRole);
      console.log('Permission system loaded:', permissionsLoaded);
      console.log('User profile:', userProfile);
      setIsLoading(true);
      
      // Update cache with loading state
      sidebarCache.set(cacheKey, {
        menuItems: [],
        isLoading: true,
        timestamp: Date.now()
      });
      
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
        
        let finalItems: MenuItem[];
        if (data?.menu_items && Array.isArray(data.menu_items) && data.menu_items.length > 0) {
          console.log('Found saved preferences, filtering menu items');
          // Filter out invalid items and ensure all valid items are included
          const savedItemIds = data.menu_items;
          const orderedItems = savedItemIds
            .map(id => defaultItems.find(item => item.id === id))
            .filter(Boolean) as MenuItem[];
          
          finalItems = orderedItems;
        } else {
          console.log('No saved preferences, using default items');
          finalItems = defaultItems;
        }

        // Update cache and state
        sidebarCache.set(cacheKey, {
          menuItems: finalItems,
          isLoading: false,
          timestamp: Date.now()
        });
        
        setMenuItems(finalItems);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading sidebar preferences:', error);
        const fallbackItems = getDefaultMenuItemsForRole(userRole);
        
        // Update cache with fallback
        sidebarCache.set(cacheKey, {
          menuItems: fallbackItems,
          isLoading: false,
          timestamp: Date.now()
        });
        
        setMenuItems(fallbackItems);
        setIsLoading(false);
      }
    }, 100); // 100ms debounce
  }, [userId, userRole, permissionsLoaded, hasPermission, cacheKey]);

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