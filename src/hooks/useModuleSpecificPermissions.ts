import { useModulePermissions, usePermissions } from './usePermissions';

// Task-specific permissions
export const useTaskPermissions = () => {
  const modulePermissions = useModulePermissions('tasks');
  const { hasPermission } = usePermissions();
  
  return {
    ...modulePermissions,
    canAssign: hasPermission('tasks', 'assign'),
    canManageOptions: hasPermission('tasks', 'manage_options'),
  };
};

// User management specific permissions
export const useUserPermissions = () => {
  const modulePermissions = useModulePermissions('users');
  const { hasPermission } = usePermissions();
  
  return {
    ...modulePermissions,
    canActivateDeactivate: hasPermission('users', 'activate_deactivate'),
    canResetPassword: hasPermission('users', 'reset_password'),
    canBulkImport: hasPermission('users', 'bulk_import'),
  };
};

// Event-specific permissions
export const useEventPermissions = () => {
  const modulePermissions = useModulePermissions('events');
  const { hasPermission } = usePermissions();
  
  return {
    ...modulePermissions,
    canAssign: hasPermission('events', 'assign'),
  };
};

// Competition-specific permissions
export const useCompetitionPermissions = () => {
  const modulePermissions = useModulePermissions('competitions');
  const { hasPermission } = usePermissions();
  
  return {
    ...modulePermissions,
    canManageTemplates: hasPermission('competitions', 'manage_templates'),
    canManageScoring: hasPermission('competitions', 'manage_scoring'),
  };
};

// Incident-specific permissions
export const useIncidentPermissions = () => {
  const modulePermissions = useModulePermissions('incidents');
  const { hasPermission } = usePermissions();
  
  return {
    ...modulePermissions,
    canSubmit: hasPermission('incidents', 'submit'),
    canApprove: hasPermission('incidents', 'approve'),
  };
};

// Job Board specific permissions
export const useJobBoardPermissions = () => {
  const modulePermissions = useModulePermissions('job_board');
  const { hasPermission } = usePermissions();
  
  return {
    ...modulePermissions,
    canManageHierarchy: hasPermission('job_board', 'manage_hierarchy'),
  };
};

// Inventory-specific permissions
export const useInventoryPermissions = () => {
  const modulePermissions = useModulePermissions('inventory');
  const { hasPermission } = usePermissions();
  
  return {
    ...modulePermissions,
    canAssign: hasPermission('inventory', 'assign'),
  };
};

// Dashboard-specific permissions
export const useDashboardPermissions = () => {
  const modulePermissions = useModulePermissions('dashboard');
  const { hasPermission } = usePermissions();
  
  return {
    ...modulePermissions,
    canViewAnalytics: hasPermission('dashboard', 'view_analytics'),
  };
};