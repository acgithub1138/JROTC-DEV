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

  // Auto-redirect mobile users to mobile interface
  useEffect(() => {
    if ((isMobile || isNative) && !location.pathname.startsWith('/mobile') && location.pathname.startsWith('/app')) {
      console.log('Mobile device detected, redirecting to mobile interface');
      navigate('/mobile/dashboard', { replace: true });
    }
  }, [isMobile, isNative, location.pathname, navigate]);

  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  );
};