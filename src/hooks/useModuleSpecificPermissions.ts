import { usePermissionContext } from '@/contexts/PermissionContext';

// Helper hook for module permissions
const useModulePermissions = (module: string) => {
  const { hasPermission } = usePermissionContext();
  
  return {
    canAccess: hasPermission(module, 'sidebar'),
    canRead: hasPermission(module, 'read'),
    canViewDetails: hasPermission(module, 'view'),
    canCreate: hasPermission(module, 'create'),
    canUpdate: hasPermission(module, 'update'),
    canDelete: hasPermission(module, 'delete'),
  };
};

// Task-specific permissions
export const useTaskPermissions = () => {
  const modulePermissions = useModulePermissions('tasks');
  const { hasPermission } = usePermissionContext();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canViewDetails,
    canAssign: hasPermission('tasks', 'assign'),
    canManageOptions: hasPermission('tasks', 'manage_options'),
    canUpdateAssigned: hasPermission('tasks', 'update_assigned'),
  };
};

// User management specific permissions
export const useUserPermissions = () => {
  const modulePermissions = useModulePermissions('users');
  const { hasPermission } = usePermissionContext();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canResetPassword: hasPermission('users', 'reset_password'),
    canBulkImport: hasPermission('users', 'bulk_import'),
  };
};

// Cadet management specific permissions
export const useCadetPermissions = () => {
  const modulePermissions = useModulePermissions('cadets');
  const { hasPermission } = usePermissionContext();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canResetPassword: hasPermission('cadets', 'reset_password'),
    canBulkImport: hasPermission('cadets', 'bulk_import'),
  };
};

// Event-specific permissions
export const useEventPermissions = () => {
  const modulePermissions = useModulePermissions('events');
  const { hasPermission } = usePermissionContext();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canAssign: hasPermission('events', 'assign'),
  };
};

// Competition-specific permissions
export const useCompetitionPermissions = () => {
  const modulePermissions = useModulePermissions('competitions');
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
  };
};


// Job Board specific permissions
export const useJobBoardPermissions = () => {
  const modulePermissions = useModulePermissions('job_board');
  const { hasPermission } = usePermissionContext();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canManageHierarchy: hasPermission('job_board', 'manage_hierarchy'),
  };
};

// Inventory-specific permissions
export const useInventoryPermissions = () => {
  const modulePermissions = useModulePermissions('inventory');
  const { hasPermission } = usePermissionContext();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canCreate: modulePermissions.canCreate,
    canAssign: hasPermission('inventory', 'assign'),
    canBulkImport: hasPermission('inventory', 'bulk_import'),
  };
};

// Dashboard-specific permissions
export const useDashboardPermissions = () => {
  const modulePermissions = useModulePermissions('dashboard');
  const { hasPermission } = usePermissionContext();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canViewAnalytics: hasPermission('dashboard', 'view_analytics'),
  };
};

// Incident-specific permissions
export const useIncidentPermissions = () => {
  const modulePermissions = useModulePermissions('incident_management');
  const { hasPermission } = usePermissionContext();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canViewDetails,
    canAssign: hasPermission('incident_management', 'assign'),
    canUpdateAssigned: hasPermission('incident_management', 'update_assigned'),
  };
};

// Calendar-specific permissions
export const useCalendarPermissions = () => {
  const modulePermissions = useModulePermissions('calendar');
  const { hasPermission } = usePermissionContext();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canViewDetails: hasPermission('calendar', 'view'),
  };
};

// Email Management specific permissions
export const useEmailPermissions = () => {
  const modulePermissions = useModulePermissions('email');
  const { hasPermission } = usePermissionContext();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canManageTemplates: hasPermission('email', 'manage_templates'),
    canManageRules: hasPermission('email', 'manage_rules'),
    canProcessQueue: hasPermission('email', 'process_queue'),
  };
};