import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionContext } from '@/contexts/PermissionContext';
import { useLocation, useNavigate } from 'react-router-dom';
import PasswordChangeDialog from './auth/PasswordChangeDialog';
import ParentSetupModal from './auth/ParentSetupModal';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useDeepCompareEffect } from '@/hooks/useDeepCompareEffect';
import AuthPage from '@/components/auth/AuthPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  module?: string; // Module name for permission checking
  requirePermission?: 'sidebar' | 'read' | 'view'; // Which permission to check
  requireAdminRole?: boolean; // Require admin role specifically
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  module, 
  requirePermission = 'read',
  requireAdminRole = false 
}) => {
  const { user, userProfile, loading, refreshProfile } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = usePermissionContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [showParentSetup, setShowParentSetup] = useState(false);
  const queryClient = useQueryClient();
  const parentSetupCheckRef = useRef<boolean>(false);

  // Redirect external users to competition portal if they try to access CCC routes
  useEffect(() => {
    if (userProfile?.role === 'external' && 
        location.pathname.startsWith('/app') && 
        !location.pathname.startsWith('/app/competition-portal')) {
      navigate('/app/competition-portal/open-competitions', { replace: true });
    }
  }, [userProfile?.role, location.pathname, navigate]);

  // Memoized password change check
  const passwordChangeRequired = useMemo(() => {
    if (!user || !userProfile) return false;

    const profileRequiresChange = userProfile.password_change_required === true;
    const metadataOverride = user.user_metadata?.password_change_required === false;
    
    return profileRequiresChange && !metadataOverride;
  }, [user?.id, userProfile?.password_change_required, user?.user_metadata?.password_change_required]);

  // Update password dialog state - show whenever password change is required
  useDeepCompareEffect(() => {
    setShowPasswordChange(passwordChangeRequired);
  }, [passwordChangeRequired]);

  // Memoized permission and admin role check
  const accessGranted = useMemo(() => {
    if (loading || permissionsLoading || !user) return null;

    let hasAccess = true;

    // Check admin role requirement
    if (requireAdminRole) {
      hasAccess = userProfile?.role === 'admin';
    }

    // Check module permission requirement
    if (module && requirePermission) {
      hasAccess = hasAccess && hasPermission(module, requirePermission);
    }

    return hasAccess;
  }, [loading, permissionsLoading, user?.id, userProfile?.role, module, requirePermission, requireAdminRole, hasPermission]);

  // Update access denied state
  useDeepCompareEffect(() => {
    if (accessGranted !== null) {
      setShowAccessDenied(!accessGranted);
    }
  }, [accessGranted]);

  // Memoized parent setup check with debouncing
  const parentSetupRequired = useMemo(() => {
    return user && userProfile && userProfile.role === 'parent';
  }, [user?.id, userProfile?.role]);

  // Check if parent user needs to complete setup with debouncing
  useDeepCompareEffect(() => {
    if (!parentSetupRequired) {
      setShowParentSetup(false);
      parentSetupCheckRef.current = false;
      return;
    }

    // Reset the ref when dependencies change so we can recheck
    if (parentSetupCheckRef.current) {
      parentSetupCheckRef.current = false;
    }

    const timeoutId = setTimeout(async () => {
      try {
        // Check if the parent has any contact records - use consistent query structure
        const { data: contacts, error } = await supabase
          .from('contacts')
          .select('id')
          .eq('type', 'parent')
          .eq('email', userProfile!.email)
          .eq('school_id', userProfile!.school_id)
          .limit(1);

        if (error) {
          console.error('Error checking parent setup:', error);
          setShowParentSetup(false);
          return;
        }

        // If no contact record exists, show setup modal
        const needsSetup = !contacts || contacts.length === 0;
        setShowParentSetup(needsSetup);
        parentSetupCheckRef.current = true;
      } catch (error) {
        console.error('Error in parent setup check:', error);
        setShowParentSetup(false);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [parentSetupRequired, userProfile?.email, userProfile?.school_id]);

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
    return <AuthPage />;
  }
  
  // Show password change dialog if required
  if (showPasswordChange) {
    return (
      <>
        {children}
        <PasswordChangeDialog 
          open={showPasswordChange} 
          onClose={() => {
            setShowPasswordChange(false);
          }} 
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
  
  return (
    <>
      {children}
      <ParentSetupModal 
        open={showParentSetup} 
        onClose={() => {
          setShowParentSetup(false);
          // Reset the check ref so the main useEffect can run again
          parentSetupCheckRef.current = false;
        }}
      />
    </>
  );
};

export default ProtectedRoute;