import { useAuth } from '@/contexts/AuthContext';
import { User, UserRole } from '../types';

export const useUserPermissions = () => {
  const { userProfile } = useAuth();

  const getAllowedRoles = (): UserRole[] => {
    if (!userProfile) return [];
    
    if (userProfile.role === 'admin') {
      return ['admin', 'instructor', 'command_staff', 'cadet', 'parent'];
    }
    
    if (userProfile.role === 'instructor') {
      return ['instructor', 'command_staff', 'cadet', 'parent'];
    }
    
    if (userProfile.role === 'command_staff') {
      return ['cadet'];
    }
    
    return ['cadet'];
  };

  const canCreateUsers = () => {
    return userProfile?.role === 'admin' || userProfile?.role === 'instructor';
  };

  const canEditUser = (user: User) => {
    if (!userProfile) return false;
    
    if (userProfile.role === 'admin') return true;
    
    if (userProfile.role === 'instructor' && user.school_id === userProfile.school_id) return true;
    
    if (userProfile.role === 'command_staff' && 
        user.school_id === userProfile.school_id && 
        (user.role === 'command_staff' || user.role === 'cadet')) return true;
    
    if (user.id === userProfile.id) return true;
    
    return false;
  };

  const canDisableUser = (user: User) => {
    if (!userProfile) return false;
    
    // Can only disable users who are currently active
    if (!user.active) return false;
    
    // Can't disable yourself
    if (user.id === userProfile.id) return false;
    
    if (userProfile.role === 'admin') return true;
    
    if (userProfile.role === 'instructor' && 
        user.school_id === userProfile.school_id && 
        user.role !== 'admin' && user.role !== 'instructor') return true;
    
    return false;
  };

  const canEnableUser = (user: User) => {
    if (!userProfile) return false;
    
    // Can only enable users who are currently disabled
    if (user.active) return false;
    
    if (userProfile.role === 'admin') return true;
    
    if (userProfile.role === 'instructor' && 
        user.school_id === userProfile.school_id && 
        user.role !== 'admin' && user.role !== 'instructor') return true;
    
    return false;
  };

  const canResetPassword = (user: User) => {
    return userProfile?.role === 'admin' && user.id !== userProfile.id;
  };

  return {
    getAllowedRoles,
    canCreateUsers,
    canEditUser,
    canDisableUser,
    canEnableUser,
    canResetPassword,
  };
};