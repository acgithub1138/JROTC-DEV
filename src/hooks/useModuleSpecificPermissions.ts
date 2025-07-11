import { useModulePermissions, usePermissions } from './usePermissions';

// Task-specific permissions
export const useTaskPermissions = () => {
  const modulePermissions = useModulePermissions('tasks');
  const { hasPermission } = usePermissions();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead, // Backwards compatibility
    canAssign: hasPermission('tasks', 'assign'),
    canManageOptions: hasPermission('tasks', 'manage_options'),
    canUpdateAssigned: hasPermission('tasks', 'update_assigned'),
  };
};

// User management specific permissions
export const useUserPermissions = () => {
  const modulePermissions = useModulePermissions('users');
  const { hasPermission } = usePermissions();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead, // Backwards compatibility
    canResetPassword: hasPermission('users', 'reset_password'),
    canBulkImport: hasPermission('users', 'bulk_import'),
  };
};

// Cadet management specific permissions
export const useCadetPermissions = () => {
  const modulePermissions = useModulePermissions('cadets');
  const { hasPermission } = usePermissions();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead, // Backwards compatibility
    canResetPassword: hasPermission('cadets', 'reset_password'),
    canBulkImport: hasPermission('cadets', 'bulk_import'),
  };
};

// Event-specific permissions
export const useEventPermissions = () => {
  const modulePermissions = useModulePermissions('events');
  const { hasPermission } = usePermissions();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead, // Backwards compatibility
    canAssign: hasPermission('events', 'assign'),
  };
};

// Competition-specific permissions
export const useCompetitionPermissions = () => {
  const modulePermissions = useModulePermissions('competitions');
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead, // Backwards compatibility
    
  };
};


// Job Board specific permissions
export const useJobBoardPermissions = () => {
  const modulePermissions = useModulePermissions('job_board');
  const { hasPermission } = usePermissions();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead, // Backwards compatibility
    canManageHierarchy: hasPermission('job_board', 'manage_hierarchy'),
  };
};

// Inventory-specific permissions
export const useInventoryPermissions = () => {
  const modulePermissions = useModulePermissions('inventory');
  const { hasPermission } = usePermissions();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead, // Backwards compatibility
    canAssign: hasPermission('inventory', 'assign'),
    canBulkImport: hasPermission('inventory', 'bulk_import'),
  };
};

// Dashboard-specific permissions
export const useDashboardPermissions = () => {
  const modulePermissions = useModulePermissions('dashboard');
  const { hasPermission } = usePermissions();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead, // Backwards compatibility
    canViewAnalytics: hasPermission('dashboard', 'view_analytics'),
  };
};

// Calendar-specific permissions
export const useCalendarPermissions = () => {
  const modulePermissions = useModulePermissions('calendar');
  const { hasPermission } = usePermissions();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead, // Backwards compatibility
    canViewDetails: hasPermission('calendar', 'view'),
  };
};

// Email Management specific permissions
export const useEmailPermissions = () => {
  const modulePermissions = useModulePermissions('email');
  const { hasPermission } = usePermissions();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead, // Backwards compatibility
    canManageTemplates: hasPermission('email', 'manage_templates'),
    canManageRules: hasPermission('email', 'manage_rules'),
    canProcessQueue: hasPermission('email', 'process_queue'),
  };
};