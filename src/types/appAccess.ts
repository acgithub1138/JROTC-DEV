// App Access Types and Utility Functions
// Defines the structure for controlling access to CCC and Competition portals

export type CompetitionTier = 'none' | 'basic' | 'analytics' | 'host';

export interface AppAccess {
  ccc: { access: boolean };
  competition: { tier: CompetitionTier };
}

// Tier hierarchy for comparison
const TIER_HIERARCHY: CompetitionTier[] = ['none', 'basic', 'analytics', 'host'];

/**
 * Check if user can access the CCC portal
 */
export function canAccessCCC(appAccess: AppAccess | null | undefined): boolean {
  return appAccess?.ccc?.access === true;
}

/**
 * Check if user can access the Competition portal (any tier except 'none')
 */
export function canAccessCompetitionPortal(appAccess: AppAccess | null | undefined): boolean {
  const tier = appAccess?.competition?.tier;
  return tier !== undefined && tier !== 'none';
}

/**
 * Get the competition tier for the user's school
 */
export function getCompetitionTier(appAccess: AppAccess | null | undefined): CompetitionTier {
  return appAccess?.competition?.tier || 'none';
}

/**
 * Check if the current tier meets or exceeds the required tier
 * Hierarchy: none < basic < analytics < host
 */
export function hasCompetitionTierAtLeast(
  currentTier: CompetitionTier | undefined | null,
  requiredTier: CompetitionTier
): boolean {
  const current = currentTier || 'none';
  const currentIndex = TIER_HIERARCHY.indexOf(current);
  const requiredIndex = TIER_HIERARCHY.indexOf(requiredTier);
  return currentIndex >= requiredIndex;
}

/**
 * Create a default AppAccess object
 */
export function createDefaultAppAccess(): AppAccess {
  return {
    ccc: { access: false },
    competition: { tier: 'none' }
  };
}

/**
 * Parse app_access from database (handles null/undefined)
 */
export function parseAppAccess(data: unknown): AppAccess {
  if (!data || typeof data !== 'object') {
    return createDefaultAppAccess();
  }
  
  const obj = data as Record<string, unknown>;
  
  return {
    ccc: {
      access: Boolean((obj.ccc as Record<string, unknown>)?.access)
    },
    competition: {
      tier: (((obj.competition as Record<string, unknown>)?.tier) as CompetitionTier) || 'none'
    }
  };
}

/**
 * Get tier display label
 */
export function getTierLabel(tier: CompetitionTier): string {
  const labels: Record<CompetitionTier, string> = {
    none: 'None',
    basic: 'Basic',
    analytics: 'Analytics',
    host: 'Host'
  };
  return labels[tier];
}

/**
 * Get all available tiers for dropdowns
 */
export function getAllTiers(): { value: CompetitionTier; label: string }[] {
  return TIER_HIERARCHY.map(tier => ({
    value: tier,
    label: getTierLabel(tier)
  }));
}
