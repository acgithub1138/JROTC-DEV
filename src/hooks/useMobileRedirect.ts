import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from './use-mobile';
import { useCapacitor } from './useCapacitor';

export const useMobileRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isNative } = useCapacitor();
  const [showMobileSuggestion, setShowMobileSuggestion] = useState(false);

  useEffect(() => {
    // Show mobile suggestion if user is on mobile but not on mobile routes
    if ((isMobile || isNative) && !location.pathname.startsWith('/mobile')) {
      // Don't show on marketing pages
      if (!location.pathname.startsWith('/app')) {
        return;
      }
      
      setShowMobileSuggestion(true);
    }
  }, [isMobile, isNative, location.pathname]);

  const goToMobile = () => {
    navigate('/mobile/dashboard');
    setShowMobileSuggestion(false);
  };

  const dismissSuggestion = () => {
    setShowMobileSuggestion(false);
  };

  return {
    showMobileSuggestion,
    goToMobile,
    dismissSuggestion,
    isMobile: isMobile || isNative
  };
};