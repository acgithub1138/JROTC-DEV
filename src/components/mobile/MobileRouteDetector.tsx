import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCapacitor } from '@/hooks/useCapacitor';
import ProtectedRoute from '@/components/ProtectedRoute';

export const MobileRouteDetector: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isNative } = useCapacitor();

  useEffect(() => {
    // Auto-redirect to dashboard if on mobile root
    if (location.pathname === '/mobile' || location.pathname === '/mobile/') {
      navigate('/mobile/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Suggest mobile version for mobile users coming from web routes
  useEffect(() => {
    if ((isMobile || isNative) && !location.pathname.startsWith('/mobile')) {
      console.log('Mobile device detected, suggesting mobile interface');
      // Could show a toast or banner suggesting mobile interface
    }
  }, [isMobile, isNative, location.pathname]);

  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  );
};