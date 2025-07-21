
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionContext } from '@/contexts/PermissionContext';
import AuthPage from '@/components/auth/AuthPage';
import PasswordChangeDialog from '@/components/auth/PasswordChangeDialog';
import { AccessDeniedDialog } from '@/components/incident-management/AccessDeniedDialog';

interface ProtectedRouteProps {
  children: React.ReactNode;
  module?: string; // Module name for permission checking
  requirePermission?: 'sidebar' | 'read' | 'view'; // Which permission to check
  requireAdminRole?: boolean; // Require admin role specifically
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  module,
  requirePermission = 'sidebar',
  requireAdminRole = false
}) => {
  const { user, userProfile, loading } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = usePermissionContext();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  console.log('ProtectedRoute - user:', user?.id, 'loading:', loading, 'permissionsLoading:', permissionsLoading);

  // Check if user needs to change password
  useEffect(() => {
    if (user && userProfile && userProfile.password_change_required) {
      setShowPasswordChange(true);
    } else {
      setShowPasswordChange(false);
    }
  }, [user, userProfile]);

  // Check module permissions or admin role requirement
  useEffect(() => {
    // Don't check permissions while they're still loading
    if (permissionsLoading || !user) {
      setShowAccessDenied(false);
      return;
    }

    if (requireAdminRole) {
      // Check if user is admin
      const isAdmin = userProfile?.role === 'admin';
      setShowAccessDenied(!isAdmin);
    } else if (module) {
      // Check module permissions
      const hasAccess = hasPermission(module, requirePermission);
      console.log(`Permission check for ${module}:${requirePermission} = ${hasAccess}`);
      setShowAccessDenied(!hasAccess);
    } else {
      setShowAccessDenied(false);
    }
  }, [user, userProfile, module, requirePermission, requireAdminRole, hasPermission, permissionsLoading]);

  // Show loading while auth or permissions are loading
  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('No user found, showing auth page');
    return <AuthPage />;
  }

  console.log('User authenticated, showing main app');
  
  // Show password change dialog if required
  if (showPasswordChange) {
    return (
      <>
        {children}
        <PasswordChangeDialog 
          open={showPasswordChange} 
          onClose={() => setShowPasswordChange(false)} 
        />
      </>
    );
  }

  // Show access denied if user doesn't have permission for this module or admin requirement
  if (showAccessDenied && (module || requireAdminRole)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You do not have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
