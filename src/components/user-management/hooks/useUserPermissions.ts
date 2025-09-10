import { useAuth } from '@/contexts/AuthContext';
import { User, UserRole } from '../types';
import { useDynamicRoles, DynamicRole } from '@/hooks/useDynamicRoles';
import { usePermissionContext } from '@/contexts/PermissionContext';

export const useUserPermissions = () => {
  const { userProfile } = useAuth();
  const { allRoles, assignableRoles } = useDynamicRoles();
  const { hasPermission } = usePermissionContext();

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
    return hasPermission('user_admin', 'create');
  };

  const canEditUser = (user: User) => {
    if (!userProfile) return false;
    
    // Can edit yourself
    if (user.id === userProfile.id) return true;
    
    // Check database permission for updating users
    if (!hasPermission('user_admin', 'update')) return false;
    
    // Admin users can edit users across all schools
    if (userProfile.role === 'admin') return true;
    
    // Non-admin users can only edit users in their own school
    return user.school_id === userProfile.school_id;
  };

  const canDisableUser = (user: User) => {
    if (!userProfile) return false;
    
    // Can only disable users who are currently active
    if (!user.active) return false;
    
    // Can't disable yourself
    if (user.id === userProfile.id) return false;
    
    // Check database permission for updating users
    if (!hasPermission('user_admin', 'update')) return false;
    
    // Admin users can disable users across all schools
    if (userProfile.role === 'admin') return true;
    
    // Non-admin users can only disable users in their own school
    return user.school_id === userProfile.school_id;
  };

  const canEnableUser = (user: User) => {
    if (!userProfile) return false;
    
    // Can only enable users who are currently disabled
    if (user.active) return false;
    
    // Check database permission for updating users
    if (!hasPermission('user_admin', 'update')) return false;
    
    // Admin users can enable users across all schools
    if (userProfile.role === 'admin') return true;
    
    // Non-admin users can only enable users in their own school
    return user.school_id === userProfile.school_id;
  };

  const canResetPassword = (user: User) => {
    if (!userProfile) return false;
    
    // Can't reset your own password
    if (user.id === userProfile.id) return false;
    
    // Check database permission for updating users
    if (!hasPermission('user_admin', 'update')) return false;
    
    // Admin users can reset passwords across all schools
    if (userProfile.role === 'admin') return true;
    
    // Non-admin users can only reset passwords in their own school
    return user.school_id === userProfile.school_id;
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