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
  
  if (!jrotcProgram) return rank;
  
  const ranks = getRanksForProgram(jrotcProgram);
  const rankData = ranks.find(r => r.rank === rank);
  
  if (rankData && rankData.abbreviation) {
    return `${rankData.rank} (${rankData.abbreviation})`;
  }
  
  return rank;
};