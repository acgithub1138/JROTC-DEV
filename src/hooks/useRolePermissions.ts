import { useAuth } from '@/contexts/AuthContext';

export const useRolePermissions = () => {
  const { userProfile } = useAuth();

  const canManageCompetitions = () => {
    return userProfile?.role === 'admin' || userProfile?.role === 'instructor';
  };

  const canViewCompetitions = () => {
    return userProfile?.role === 'admin' || 
           userProfile?.role === 'instructor' || 
           userProfile?.role === 'command_staff' || 
           userProfile?.role === 'cadet';
  };

  const canManageJobBoard = () => {
    return userProfile?.role === 'admin' || 
           userProfile?.role === 'instructor' || 
           userProfile?.role === 'command_staff';
  };

  const canViewJobBoard = () => {
    return userProfile?.role === 'admin' || 
           userProfile?.role === 'instructor' || 
           userProfile?.role === 'command_staff' || 
           userProfile?.role === 'cadet';
  };

  const canManageInventory = () => {
    return userProfile?.role === 'admin' || 
           userProfile?.role === 'instructor' || 
           userProfile?.role === 'command_staff';
  };

  const canViewInventory = () => {
    return userProfile?.role === 'admin' || 
           userProfile?.role === 'instructor' || 
           userProfile?.role === 'command_staff';
  };

  const canCreateTasks = () => {
    return userProfile?.role === 'admin' || 
           userProfile?.role === 'instructor' || 
           userProfile?.role === 'command_staff';
  };

  const canCreateEvents = () => {
    return userProfile?.role === 'admin' || 
           userProfile?.role === 'instructor' || 
           userProfile?.role === 'command_staff';
  };

  const isCommandStaffOrAbove = () => {
    return userProfile?.role === 'admin' || 
           userProfile?.role === 'instructor' || 
           userProfile?.role === 'command_staff';
  };

  const isCadet = () => {
    return userProfile?.role === 'cadet';
  };

  return {
    canManageCompetitions,
    canViewCompetitions,
    canManageJobBoard,
    canViewJobBoard,
    canManageInventory,
    canViewInventory,
    canCreateTasks,
    canCreateEvents,
    isCommandStaffOrAbove,
    isCadet,
  };
};