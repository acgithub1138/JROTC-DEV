import { useMemo } from 'react';
import { usePermissionContext } from '@/contexts/PermissionContext';

// Centralized inventory permissions hook that fetches all permissions once
export const useOptimizedInventoryPermissions = () => {
  const { hasPermission, isLoading } = usePermissionContext();
  
  // Memoize all inventory-related permissions to prevent recalculation
  const permissions = useMemo(() => {
    return {
      // Basic CRUD permissions
      canAccess: hasPermission('inventory', 'sidebar'),
      canRead: hasPermission('inventory', 'read'),
      canViewDetails: hasPermission('inventory', 'view'),
      canCreate: hasPermission('inventory', 'create'),
      canUpdate: hasPermission('inventory', 'update'),
      canDelete: hasPermission('inventory', 'delete'),
      
      // Specific inventory permissions
      canView: hasPermission('inventory', 'read'),
      canAssign: hasPermission('inventory', 'assign'),
      canBulkImport: hasPermission('inventory', 'bulk_import'),
      
      // Loading state
      isLoading,
    };
  }, [hasPermission, isLoading]);

  return permissions;
};

// Re-export for backward compatibility
export const useInventoryPermissions = useOptimizedInventoryPermissions;

// Table-specific permissions for inventory
export const useInventoryTablePermissions = () => {
  const permissions = useOptimizedInventoryPermissions();
  
  return useMemo(() => ({
    canView: permissions.canRead,
    canViewDetails: permissions.canViewDetails,
    canEdit: permissions.canUpdate,
    canDelete: permissions.canDelete,
    canCreate: permissions.canCreate,
  }), [permissions]);
};

// Actions-specific permissions for inventory
export const useInventoryActionsPermissions = () => {
  const permissions = useOptimizedInventoryPermissions();
  
  return useMemo(() => ({
    canCreate: permissions.canCreate,
    canBulkImport: permissions.canBulkImport,
    isLoading: permissions.isLoading,
  }), [permissions]);
};