
import { Profile } from '../types';
import { RECORDS_PER_PAGE } from '../constants';

export const getFilteredProfiles = (
  profiles: Profile[], 
  activeTab: string, 
  searchTerm: string
): Profile[] => {
  const isActive = activeTab === 'active';
  return profiles.filter(profile => {
    const matchesActiveStatus = profile.active === isActive;
    
    if (!searchTerm) return matchesActiveStatus;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      profile.first_name.toLowerCase().includes(searchLower) ||
      profile.last_name.toLowerCase().includes(searchLower) ||
      profile.email.toLowerCase().includes(searchLower) ||
      profile.role.toLowerCase().includes(searchLower) ||
      profile.grade?.toLowerCase().includes(searchLower) ||
      profile.rank?.toLowerCase().includes(searchLower) ||
      profile.flight?.toLowerCase().includes(searchLower);
    
    return matchesActiveStatus && matchesSearch;
  });
};

export const getPaginatedProfiles = (
  profiles: Profile[], 
  currentPage: number
): Profile[] => {
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;
  return profiles.slice(startIndex, endIndex);
};

export const getTotalPages = (profilesLength: number): number => {
  return Math.ceil(profilesLength / RECORDS_PER_PAGE);
};
