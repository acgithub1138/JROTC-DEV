import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

type PortalType = 'ccc' | 'competition';

interface PortalContextType {
  currentPortal: PortalType;
  setPortal: (portal: PortalType) => void;
  canAccessCompetitionPortal: boolean;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export const usePortal = () => {
  const context = useContext(PortalContext);
  if (context === undefined) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
};

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile } = useAuth();
  const [currentPortal, setCurrentPortal] = useState<PortalType>('ccc');

  // Check if user can access competition portal
  const canAccessCompetitionPortal = userProfile?.schools?.competition_module === true;
  
  console.log('PortalContext - Competition Portal Access Check:', {
    userId: userProfile?.id,
    schoolId: userProfile?.school_id,
    competitionModule: userProfile?.schools?.competition_module,
    competitionPortal: userProfile?.schools?.competition_portal,
    canAccessCompetitionPortal,
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR',
    isCapacitor: typeof window !== 'undefined' && window.location.protocol === 'capacitor:',
    fullSchoolData: userProfile?.schools
  });

  // Get stored portal preference
  useEffect(() => {
    const storedPortal = localStorage.getItem('currentPortal') as PortalType;
    if (storedPortal && canAccessCompetitionPortal) {
      setCurrentPortal(storedPortal);
    } else {
      setCurrentPortal('ccc');
    }
  }, [canAccessCompetitionPortal]);

  const setPortal = (portal: PortalType) => {
    if (portal === 'competition' && !canAccessCompetitionPortal) {
      return; // Don't allow access if competition module is disabled
    }
    setCurrentPortal(portal);
    localStorage.setItem('currentPortal', portal);
  };

  const value: PortalContextType = {
    currentPortal,
    setPortal,
    canAccessCompetitionPortal,
  };

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
};