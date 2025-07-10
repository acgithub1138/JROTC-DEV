import { useModulePermissions } from './usePermissions';

export const useTablePermissions = (module: string) => {
  const { canRead, canViewDetails, canCreate, canUpdate, canDelete } = useModulePermissions(module);
  
  return {
    canView: canRead, // Access to see table data
    canViewDetails, // Access to view record details (Eye icon)
    canEdit: canUpdate,
    canDelete,
    canCreate
  };
};