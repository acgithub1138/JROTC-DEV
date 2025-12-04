// Competition Portal Permission System
// Maps modules to their school-level permission requirements

export interface CompetitionModuleRequirement {
  moduleId: string;
  requiresCompAnalytics?: boolean;
  requiresCompHosting?: boolean;
}

// Define which modules require which school-level flags
export const COMPETITION_MODULE_REQUIREMENTS: CompetitionModuleRequirement[] = [
  // Competition Analytics sections (comp_analytics = true)
  { moduleId: 'open_competitions', requiresCompAnalytics: true },
  { moduleId: 'my_competitions', requiresCompAnalytics: true },
  { moduleId: 'competitions', requiresCompAnalytics: true },
  { moduleId: 'my_competitions_reports', requiresCompAnalytics: true },
  { moduleId: 'my_competitions_analytics', requiresCompAnalytics: true }, // Alias for my_competitions_reports
  
  // Competition Hosting sections (comp_hosting = true)  
  { moduleId: 'cp_dashboard', requiresCompHosting: true },
  { moduleId: 'hosting_competitions', requiresCompHosting: true },
  { moduleId: 'cp_competitions', requiresCompHosting: true },
  { moduleId: 'cp_comp_events', requiresCompHosting: true },
  { moduleId: 'cp_comp_resources', requiresCompHosting: true },
  { moduleId: 'cp_comp_schools', requiresCompHosting: true },
  { moduleId: 'cp_schedules', requiresCompHosting: true },
  { moduleId: 'cp_comp_results', requiresCompHosting: true },
  { moduleId: 'cp_judges', requiresCompHosting: true },
  { moduleId: 'analytics', requiresCompHosting: true },
  { moduleId: 'competition_settings', requiresCompHosting: true },
  
  // Both flags allow access to score sheets (can be accessed from either section)
  { moduleId: 'cp_score_sheets', requiresCompAnalytics: true, requiresCompHosting: true },
  
  // Judges Portal sections (comp_hosting = true)
  { moduleId: 'judges_portal', requiresCompHosting: true },
  { moduleId: 'cp_judge_applications', requiresCompHosting: true },
  { moduleId: 'open_comps_open', requiresCompHosting: true },
];

/**
 * Check if a user can access a specific competition module based on school-level flags
 */
export const canAccessCompetitionModule = (
  moduleId: string,
  hasCompAnalytics: boolean,
  hasCompHosting: boolean
): boolean => {
  const requirement = COMPETITION_MODULE_REQUIREMENTS.find(req => req.moduleId === moduleId);
  
  if (!requirement) {
    // If module is not in our requirements list, deny access by default
    return false;
  }
  
  // Check if either required flag is satisfied
  const analyticsAccess = requirement.requiresCompAnalytics ? hasCompAnalytics : false;
  const hostingAccess = requirement.requiresCompHosting ? hasCompHosting : false;
  
  // For modules that require both, user needs at least one flag
  // For modules that require only one, they need that specific flag
  return analyticsAccess || hostingAccess;
};

/**
 * Filter competition modules based on school-level permissions
 */
export const filterCompetitionModulesBySchoolFlags = (
  modules: any[],
  hasCompAnalytics: boolean,
  hasCompHosting: boolean
): any[] => {
  return modules.filter(module => 
    canAccessCompetitionModule(module.id || module.name, hasCompAnalytics, hasCompHosting)
  );
};

/**
 * Get the default module for a user based on their school-level permissions
 */
export const getDefaultCompetitionModule = (
  hasCompAnalytics: boolean,
  hasCompHosting: boolean
): string => {
  // If user has competition hosting, default to dashboard
  if (hasCompHosting) {
    return 'cp_dashboard';
  }
  
  // If user only has competition analytics, default to open competitions
  if (hasCompAnalytics) {
    return 'open_competitions';
  }
  
  // Fallback (shouldn't happen if canAccessCompetitionPortal is working correctly)
  return 'open_competitions';
};
