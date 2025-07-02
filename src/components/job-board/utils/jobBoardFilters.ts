
import { JobBoardWithCadet } from '../types';

export const getFilteredJobs = (
  jobs: JobBoardWithCadet[], 
  searchTerm: string
): JobBoardWithCadet[] => {
  if (!searchTerm.trim()) return jobs;

  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return jobs.filter(job => {
    const cadetName = `${job.cadet.last_name}, ${job.cadet.first_name}${job.cadet.rank ? ` - ${job.cadet.rank}` : ''}`.toLowerCase();
    const role = job.role.toLowerCase();
    
    return cadetName.includes(lowerSearchTerm) || role.includes(lowerSearchTerm);
  });
};
