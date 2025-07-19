
import { useState, useCallback } from 'react';

export interface LayoutPreferences {
  autoResolveCollisions: boolean;
  showSquadronGroups: boolean;
  adaptiveSpacing: boolean;
}

const DEFAULT_PREFERENCES: LayoutPreferences = {
  autoResolveCollisions: true,
  showSquadronGroups: true,
  adaptiveSpacing: true,
};

export const useLayoutPreferences = () => {
  const [preferences, setPreferences] = useState<LayoutPreferences>(DEFAULT_PREFERENCES);


  const toggleCollisionResolution = useCallback(() => {
    setPreferences(prev => ({ ...prev, autoResolveCollisions: !prev.autoResolveCollisions }));
  }, []);

  const toggleSquadronGroups = useCallback(() => {
    setPreferences(prev => ({ ...prev, showSquadronGroups: !prev.showSquadronGroups }));
  }, []);

  const toggleAdaptiveSpacing = useCallback(() => {
    setPreferences(prev => ({ ...prev, adaptiveSpacing: !prev.adaptiveSpacing }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  return {
    preferences,
    toggleCollisionResolution,
    toggleSquadronGroups,
    toggleAdaptiveSpacing,
    resetToDefaults,
  };
};
