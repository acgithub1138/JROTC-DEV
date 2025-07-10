import { useModulePermissions } from './usePermissions';

export const useTablePermissions = (module: string) => {
  const { canView, canCreate, canUpdate, canDelete } = useModulePermissions(module);
  
  return {
    canView,
    canEdit: canUpdate,
    canDelete,
    canCreate
  };
};