import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

type PortalType = 'ccc' | 'competition';

interface PortalContextType {
  currentPortal: PortalType;
  setPortal: (portal: PortalType) => void;
  canAccessCompetitionPortal: boolean;
  hasCompetitionModule: boolean;
  hasCompetitionPortal: boolean;
  canAccessCompetitionSection: (section: 'module' | 'portal') => boolean;
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

  // Get school-level flags
  const hasCompetitionModule = userProfile?.schools?.comp_analytics === true;
  const hasCompetitionPortal = userProfile?.schools?.comp_hosting === true;
  
  // Check if user can access competition portal (either competition module or competition portal enabled)
  // Also exclude parent users from accessing competition portal
  const canAccessCompetitionPortal = 
    (hasCompetitionModule || hasCompetitionPortal) &&
    userProfile?.role !== 'parent';
  
  // Helper function to check access to specific competition sections
  const canAccessCompetitionSection = (section: 'module' | 'portal') => {
    if (userProfile?.role === 'parent') return false;
    return section === 'module' ? hasCompetitionModule : hasCompetitionPortal;
  };
  
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
    hasCompetitionModule,
    hasCompetitionPortal,
    canAccessCompetitionSection,
  };

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
};