// Competition Portal Permission System
// Maps modules to their tier requirements

import { CompetitionTier, hasCompetitionTierAtLeast } from '@/types/appAccess';

export interface CompetitionModuleRequirement {
  moduleId: string;
  minimumTier: CompetitionTier;
}

// Define which modules require which minimum tier
// Hierarchy: none < basic < analytics < host
export const COMPETITION_MODULE_REQUIREMENTS: CompetitionModuleRequirement[] = [
  // Basic tier: Open competitions viewing only
  { moduleId: 'open_competitions', minimumTier: 'basic' },
  { moduleId: 'open_comps_open', minimumTier: 'basic' },
  
  // Analytics tier: My competitions, analytics, reports
  { moduleId: 'my_competitions', minimumTier: 'analytics' },
  { moduleId: 'competitions', minimumTier: 'analytics' },
  { moduleId: 'my_competitions_reports', minimumTier: 'analytics' },
  { moduleId: 'my_competitions_analytics', minimumTier: 'analytics' },
  { moduleId: 'cp_score_sheets', minimumTier: 'analytics' },
  
  // Host tier: Full competition hosting/management
  { moduleId: 'cp_dashboard', minimumTier: 'host' },
  { moduleId: 'hosting_competitions', minimumTier: 'host' },
  { moduleId: 'cp_competitions', minimumTier: 'host' },
  { moduleId: 'cp_comp_events', minimumTier: 'host' },
  { moduleId: 'cp_comp_resources', minimumTier: 'host' },
  { moduleId: 'cp_comp_schools', minimumTier: 'host' },
  { moduleId: 'cp_schedules', minimumTier: 'host' },
  { moduleId: 'cp_comp_results', minimumTier: 'host' },
  { moduleId: 'cp_judges', minimumTier: 'host' },
  { moduleId: 'analytics', minimumTier: 'host' },
  { moduleId: 'competition_settings', minimumTier: 'host' },
  { moduleId: 'comp_cadets', minimumTier: 'host' },
  { moduleId: 'judges_portal', minimumTier: 'host' },
  { moduleId: 'cp_judge_applications', minimumTier: 'host' },
];

/**
 * Check if a user can access a specific competition module based on their tier
 */
export const canAccessCompetitionModule = (
  moduleId: string,
  currentTier: CompetitionTier
): boolean => {
  const requirement = COMPETITION_MODULE_REQUIREMENTS.find(req => req.moduleId === moduleId);
  
  if (!requirement) {
    // If module is not in our requirements list, deny access by default
    return false;
  }
  
  return hasCompetitionTierAtLeast(currentTier, requirement.minimumTier);
};

/**
 * Filter competition modules based on user's tier
 */
export const filterCompetitionModulesByTier = (
  modules: any[],
  currentTier: CompetitionTier
): any[] => {
  return modules.filter(module => 
    canAccessCompetitionModule(module.id || module.name, currentTier)
  );
};

/**
 * Get the default module for a user based on their tier
 */
export const getDefaultCompetitionModule = (
  currentTier: CompetitionTier
): string => {
  // If user has host tier, default to dashboard
  if (currentTier === 'host') {
    return 'cp_dashboard';
  }
  
  // If user has analytics tier, default to my competitions
  if (currentTier === 'analytics') {
    return 'my_competitions';
  }
  
  // Basic tier defaults to open competitions
  return 'open_competitions';
};

/**
 * Get the minimum tier required for a module
 */
export const getModuleMinimumTier = (moduleId: string): CompetitionTier => {
  const requirement = COMPETITION_MODULE_REQUIREMENTS.find(req => req.moduleId === moduleId);
  return requirement?.minimumTier || 'host'; // Default to highest tier if not found
};
