import { useTablePermissions } from './useTablePermissions';

export const useJudgesPortalPermissions = () => {
  return useTablePermissions('judges_portal');
};
