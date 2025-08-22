import { useSidebarPreferencesContext } from '@/contexts/SidebarPreferencesContext';
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
  'competitions': 'competitions',
  'email-management': 'email',
  'user-admin': 'user_admin',
  'school-management': 'school_management',
  'role-management': 'role_management',
  'settings': 'settings'
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

  // No special handling - all roles use the permission system

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
      label: 'Get Help',
      icon: 'AlertTriangle',
      path: '/app/incidents',
      isVisible: hasPermission('incident_management', 'sidebar'),
      order: 11
    },
    {
      id: 'email-management',
      label: 'Email Management',
      icon: 'Mails',
      path: '/app/email',
      isVisible: hasPermission('email', 'sidebar'),
      order: 12
    },
    {
      id: 'user-admin',
      label: 'User Management',
      icon: 'UserCog',
      path: '/app/users',
      isVisible: hasPermission('user_admin', 'sidebar'),
      order: 13
    },
    {
      id: 'school-management',
      label: 'School Management',
      icon: 'Building2',
      path: '/app/school',
      isVisible: hasPermission('school_management', 'sidebar'),
      order: 14
    },
    {
      id: 'role-management',
      label: 'Role Management',
      icon: 'Shield',
      path: '/app/roles',
      isVisible: hasPermission('role_management', 'sidebar'),
      order: 15
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'Settings',
      path: '/app/settings',
      isVisible: hasPermission('settings', 'sidebar'),
      order: 16
    }
  ];

  // Log permission checks for debugging
  allPossibleItems.forEach(item => {
    const moduleKey = MODULE_MAPPING[item.id] || item.id;
    const hasAccess = hasPermission(moduleKey, 'sidebar');
    console.log(`Permission check: ${item.id} (${moduleKey}) -> sidebar = ${hasAccess}`);
  });

  // Special handling for parent role - dashboard is always visible, check other permissions
//  if (role === 'parent') {
//    const allowedItems: MenuItem[] = [baseItems[0]]; // Dashboard is always visible
    
    // Add calendar if they have sidebar permission
//    const calendarItem = allPossibleItems.find(item => item.id === 'calendar');
//    if (calendarItem && hasPermission('calendar', 'sidebar')) {
//      allowedItems.push(calendarItem);
//    }
    
//    return allowedItems;
//  }

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
      { id: 'incident_management', label: 'Incidents', icon: 'AlertTriangle', path: '/app/incidents', isVisible: true, order: 11 },
      { id: 'user-admin', label: 'User Management', icon: 'UserCog', path: '/app/users', isVisible: true, order: 12 },
      { id: 'school-management', label: 'School Management', icon: 'Building', path: '/app/school', isVisible: true, order: 13 },
      { id: 'role-management', label: 'Role Management', icon: 'Shield', path: '/app/roles', isVisible: true, order: 14 },
      { id: 'email-management', label: 'Email Management', icon: 'Mail', path: '/app/email', isVisible: true, order: 15 },
      { id: 'settings', label: 'Settings', icon: 'Settings', path: '/app/settings', isVisible: true, order: 16 }
    ];
  } else if (role === 'parent') {
    return [
      { id: 'calendar', label: 'Calendar', icon: 'Calendar', path: '/app/calendar', isVisible: true, order: 9 }
    ];
  } else if (role === 'instructor') {
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
      { id: 'email-management', label: 'Email Management', icon: 'Mail', path: '/app/email', isVisible: true, order: 11 },
      { id: 'incident_management', label: 'Get Help', icon: 'AlertTriangle', path: '/app/incidents', isVisible: true, order: 12 },
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

// Updated hook to use the context
export const useSidebarPreferences = () => {
  const context = useSidebarPreferencesContext();
  if (!context) {
    throw new Error('useSidebarPreferences must be used within a SidebarPreferencesProvider');
  }
  return context;
};