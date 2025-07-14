import { getRanksForProgram, JROTCProgram } from './jrotcRanks';

/**
 * Formats a rank with its abbreviation based on the school's JROTC program
 * @param rank - The rank string
 * @param jrotcProgram - The school's JROTC program
 * @returns Formatted rank string with abbreviation, or fallback
 */
export const formatRankWithAbbreviation = (
  rank: string | null | undefined,
  jrotcProgram: JROTCProgram | null | undefined
): string => {
  if (!rank) return '-';
  
  // If rank already contains abbreviation in parentheses, return as is
  if (rank.includes('(') && rank.includes(')')) {
    return rank;
  }
  
  // Otherwise, try to find the abbreviation from the program ranks
  if (!jrotcProgram) return rank;
  
  const ranks = getRanksForProgram(jrotcProgram);
  const rankData = ranks.find(r => r.rank === rank);
  
  if (rankData && rankData.abbreviation) {
    return `${rankData.rank} (${rankData.abbreviation})`;
  }
  
  return rank;
};