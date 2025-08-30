/**
 * Generate year options for start year selection
 * Returns an array of years from current year back to 10 years ago
 */
export const generateYearOptions = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  
  // Generate years from current year back to 10 years ago
  for (let i = 0; i <= 10; i++) {
    years.push(currentYear - i);
  }
  
  return years;
};

/**
 * Get formatted year options for display
 */
export const getYearOptions = () => {
  return generateYearOptions().map(year => ({
    value: year.toString(),
    label: year.toString()
  }));
};