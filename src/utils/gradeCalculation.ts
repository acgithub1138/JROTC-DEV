/**
 * Utility functions for calculating school grades based on freshman year
 */

/**
 * Calculate the current school year
 * School years run August - May
 * If current month is August or later, school year = current year
 * If current month is before August, school year = current year - 1
 */
export const getCurrentSchoolYear = (): number => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based (0 = January, 7 = August)
  
  // If current month is August (7) or later, use current year
  // Otherwise, use previous year
  return currentMonth >= 7 ? currentYear : currentYear - 1;
};

/**
 * Calculate grade based on freshman year and current school year
 */
export const calculateGrade = (freshmanYear: number): string => {
  const currentSchoolYear = getCurrentSchoolYear();
  const difference = currentSchoolYear - freshmanYear;
  
  switch (difference) {
    case 0:
      return 'Freshman';
    case 1:
      return 'Sophomore';
    case 2:
      return 'Junior';
    case 3:
      return 'Senior';
    default:
      return difference >= 4 ? 'Graduate' : 'Freshman';
  }
};

/**
 * Check if a grade should be automatically calculated (not manually overridden)
 */
export const shouldAutoCalculateGrade = (freshmanYear?: number): boolean => {
  return freshmanYear !== undefined && freshmanYear > 0;
};
