// Competition Portal Permission System
// Maps modules to their school-level permission requirements

export interface CompetitionModuleRequirement {
  moduleId: string;
  requiresCompetitionModule?: boolean;
  requiresCompetitionPortal?: boolean;
}

// Define which modules require which school-level flags
export const COMPETITION_MODULE_REQUIREMENTS: CompetitionModuleRequirement[] = [
  // Competition Module sections (competition_module = true)
  { moduleId: 'open_competitions', requiresCompetitionModule: true },
  { moduleId: 'my_competitions', requiresCompetitionModule: true },
  { moduleId: 'competitions', requiresCompetitionModule: true },
  { moduleId: 'my_competitions_reports', requiresCompetitionModule: true },
  { moduleId: 'my_competitions_analytics', requiresCompetitionModule: true }, // Alias for my_competitions_reports
  
  // Competition Portal sections (competition_portal = true)  
  { moduleId: 'cp_dashboard', requiresCompetitionPortal: true },
  { moduleId: 'hosting_competitions', requiresCompetitionPortal: true },
  { moduleId: 'cp_competitions', requiresCompetitionPortal: true },
  { moduleId: 'cp_comp_events', requiresCompetitionPortal: true },
  { moduleId: 'cp_comp_resources', requiresCompetitionPortal: true },
  { moduleId: 'cp_comp_schools', requiresCompetitionPortal: true },
  { moduleId: 'cp_schedules', requiresCompetitionPortal: true },
  { moduleId: 'cp_comp_results', requiresCompetitionPortal: true },
  { moduleId: 'cp_judges', requiresCompetitionPortal: true },
  { moduleId: 'analytics', requiresCompetitionPortal: true },
  { moduleId: 'competition_settings', requiresCompetitionPortal: true },
  
  // Both flags allow access to score sheets (can be accessed from either section)
  { moduleId: 'cp_score_sheets', requiresCompetitionModule: true, requiresCompetitionPortal: true },
  
  // Judges Portal sections (competition_portal = true)
  { moduleId: 'judges_portal', requiresCompetitionPortal: true },
  { moduleId: 'cp_judge_applications', requiresCompetitionPortal: true },
  { moduleId: 'open_comps_open', requiresCompetitionPortal: true },
];

/**
 * Check if a user can access a specific competition module based on school-level flags
 */
export const canAccessCompetitionModule = (
  moduleId: string,
  hasCompetitionModule: boolean,
  hasCompetitionPortal: boolean
): boolean => {
  const requirement = COMPETITION_MODULE_REQUIREMENTS.find(req => req.moduleId === moduleId);
  
  if (!requirement) {
    // If module is not in our requirements list, deny access by default
    return false;
  }
  
  // Check if either required flag is satisfied
  const moduleAccess = requirement.requiresCompetitionModule ? hasCompetitionModule : false;
  const portalAccess = requirement.requiresCompetitionPortal ? hasCompetitionPortal : false;
  
  // For modules that require both, user needs at least one flag
  // For modules that require only one, they need that specific flag
  return moduleAccess || portalAccess;
};

/**
 * Filter competition modules based on school-level permissions
 */
export const filterCompetitionModulesBySchoolFlags = (
  modules: any[],
  hasCompetitionModule: boolean,
  hasCompetitionPortal: boolean
): any[] => {
  return modules.filter(module => 
    canAccessCompetitionModule(module.id || module.name, hasCompetitionModule, hasCompetitionPortal)
  );
};

/**
 * Get the default module for a user based on their school-level permissions
 */
export const getDefaultCompetitionModule = (
  hasCompetitionModule: boolean,
  hasCompetitionPortal: boolean
): string => {
  // If user has competition portal, default to dashboard
  if (hasCompetitionPortal) {
    return 'cp_dashboard';
  }
  
  // If user only has competition module, default to open competitions
  if (hasCompetitionModule) {
    return 'open_competitions';
  }
  
  // Fallback (shouldn't happen if canAccessCompetitionPortal is working correctly)
  return 'open_competitions';
};