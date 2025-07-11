import { usePermissionContext } from '@/contexts/PermissionContext';

export const useTablePermissions = (module: string) => {
  const { hasPermission } = usePermissionContext();
  
  return {
    canView: hasPermission(module, 'read'), // Access to see table data
    canViewDetails: hasPermission(module, 'view'), // Access to view record details (Eye icon)
    canEdit: hasPermission(module, 'update'),
    canDelete: hasPermission(module, 'delete'),
    canCreate: hasPermission(module, 'create'),
  };
};