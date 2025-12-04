import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  CompetitionTier, 
  canAccessCCC as checkCCCAccess, 
  canAccessCompetitionPortal as checkCompetitionAccess,
  getCompetitionTier,
  hasCompetitionTierAtLeast 
} from '@/types/appAccess';

type PortalType = 'ccc' | 'competition';

interface PortalContextType {
  currentPortal: PortalType;
  setPortal: (portal: PortalType) => void;
  canAccessCCC: boolean;
  canAccessCompetitionPortal: boolean;
  competitionTier: CompetitionTier;
  hasMinimumTier: (required: CompetitionTier) => boolean;
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

  // Get app access from school
  const appAccess = userProfile?.schools?.app_access;
  
  // Check CCC access
  const canAccessCCC = checkCCCAccess(appAccess);
  
  // Check competition portal access (any tier except 'none')
  // Also exclude parent users from accessing competition portal
  const canAccessCompetitionPortal = 
    checkCompetitionAccess(appAccess) &&
    userProfile?.role !== 'parent';
  
  // Get the competition tier
  const competitionTier = getCompetitionTier(appAccess);
  
  // Helper to check minimum tier requirement
  const hasMinimumTier = (required: CompetitionTier) => {
    if (userProfile?.role === 'parent') return false;
    return hasCompetitionTierAtLeast(competitionTier, required);
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
    canAccessCCC,
    canAccessCompetitionPortal,
    competitionTier,
    hasMinimumTier,
  };

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
};