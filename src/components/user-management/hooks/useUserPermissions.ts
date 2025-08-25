import { useAuth } from '@/contexts/AuthContext';
import { User, UserRole } from '../types';
import { useDynamicRoles, DynamicRole } from '@/hooks/useDynamicRoles';

export const useUserPermissions = () => {
  const { userProfile } = useAuth();
  const { allRoles, assignableRoles } = useDynamicRoles();

  const getAllowedRoles = (): DynamicRole[] => {
    if (!userProfile) return [];
    
    // Get assignable role names
    const assignableRoleNames = assignableRoles
      .filter(role => role.can_be_assigned)
      .map(role => role.role_name);
    
    // Return full role objects that match assignable role names
    return allRoles.filter(role => 
      assignableRoleNames.includes(role.role_name)
    );
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
    if (!userProfile) return false;
    
    // Can't reset your own password
    if (user.id === userProfile.id) return false;
    
    // Admins can reset anyone's password except their own
    if (userProfile.role === 'admin') return true;
    
    // Instructors can reset passwords for cadets, command_staff, and parents in their school
    if (userProfile.role === 'instructor' && 
        user.school_id === userProfile.school_id && 
        user.role !== 'admin' && user.role !== 'instructor') return true;
    
    return false;
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