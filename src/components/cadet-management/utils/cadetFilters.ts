
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
    const matchesSearch = profile.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.grade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.rank?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.flight?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
