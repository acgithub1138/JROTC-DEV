
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/components/auth/AuthPage';
import PasswordChangeDialog from '@/components/auth/PasswordChangeDialog';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, userProfile, loading } = useAuth();
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  console.log('ProtectedRoute - user:', user?.id, 'loading:', loading);

  // Check if user needs to change password
  useEffect(() => {
    if (user && userProfile && userProfile.password_change_required) {
      setShowPasswordChange(true);
    } else {
      setShowPasswordChange(false);
    }
  }, [user, userProfile]);

  if (loading) {
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
  
  return <>{children}</>;
};

export default ProtectedRoute;
