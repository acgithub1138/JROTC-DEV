
import { useState, useCallback } from 'react';
import { LayoutAlgorithm } from '../utils/nodePositioning';

export interface LayoutPreferences {
  algorithm: LayoutAlgorithm;
  autoResolveCollisions: boolean;
  showSquadronGroups: boolean;
  adaptiveSpacing: boolean;
}

const DEFAULT_PREFERENCES: LayoutPreferences = {
  algorithm: 'hierarchical',
  autoResolveCollisions: true,
  showSquadronGroups: true,
  adaptiveSpacing: true,
};

export const useLayoutPreferences = () => {
  const [preferences, setPreferences] = useState<LayoutPreferences>(DEFAULT_PREFERENCES);

  const updateAlgorithm = useCallback((algorithm: LayoutAlgorithm) => {
    setPreferences(prev => ({ ...prev, algorithm }));
  }, []);

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
    updateAlgorithm,
    toggleCollisionResolution,
    toggleSquadronGroups,
    toggleAdaptiveSpacing,
    resetToDefaults,
  };
};
