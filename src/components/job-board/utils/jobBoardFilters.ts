
import { JobBoardWithCadet } from '../types';

export const getFilteredJobs = (
  jobs: JobBoardWithCadet[], 
  searchTerm: string
): JobBoardWithCadet[] => {
  if (!searchTerm.trim()) return jobs;

  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return jobs.filter(job => {
    // Handle cases where job has no assigned cadet
    if (!job.cadet) {
      // Only search by role if no cadet is assigned
      return job.role.toLowerCase().includes(lowerSearchTerm);
    }
    
    const cadetName = `${job.cadet.last_name}, ${job.cadet.first_name}${job.cadet.rank ? ` - ${job.cadet.rank}` : ''}`.toLowerCase();
    const role = job.role.toLowerCase();
    
    return cadetName.includes(lowerSearchTerm) || role.includes(lowerSearchTerm);
  });
};
