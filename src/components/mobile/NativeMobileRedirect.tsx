import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCapacitor } from '@/hooks/useCapacitor';

export const NativeMobileRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isNative, isLoading } = useCapacitor();

  useEffect(() => {
    if (isLoading) return;
    
    console.log('NativeMobileRedirect check:', { 
      isNative, 
      currentPath: location.pathname,
      isOnMobilePath: location.pathname.startsWith('/mobile')
    });

    // If running in native app and not already on mobile path, redirect to mobile
    if (isNative && !location.pathname.startsWith('/mobile')) {
      console.log('Native app detected, redirecting to mobile interface');
      navigate('/mobile/dashboard', { replace: true });
    }
  }, [isNative, isLoading, location.pathname, navigate]);

  return null;
};