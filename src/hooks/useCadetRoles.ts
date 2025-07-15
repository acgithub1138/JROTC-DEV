import { useDynamicRoles } from './useDynamicRoles';
import { useMemo } from 'react';

export interface CadetRoleOption {
  value: string;
  label: string;
}

export const useCadetRoles = () => {
  const { assignableRoles, isLoadingAssignableRoles } = useDynamicRoles();

  // Convert to cadet management format
  const roleOptions = useMemo(() => {
    if (!assignableRoles?.length) {
      // Fallback to default roles if dynamic roles aren't loaded yet
      return [
        { value: 'cadet', label: 'Cadet' },
        { value: 'command_staff', label: 'Command Staff' }
      ];
    }

    return assignableRoles.map(role => ({
      value: role.role_name,
      label: role.role_label
    }));
  }, [assignableRoles]);

  return {
    roleOptions,
    isLoading: isLoadingAssignableRoles
  };
};