
import { Profile } from '../types';
import { ITEMS_PER_PAGE } from '@/constants/pagination';

export const getFilteredProfiles = (
  profiles: Profile[], 
  activeTab: string, 
  activeSubTab: string,
  searchTerm: string
): Profile[] => {
  // If we're not on the cadets tab, return empty array since other tabs handle their own data
  if (activeTab !== 'cadets') {
    return [];
  }
  
  return profiles.filter(profile => {
    // Handle parents tab
    if (activeSubTab === 'parents') {
      const isParent = profile.role === 'parent';
      
      if (!searchTerm) return isParent;
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        profile.first_name.toLowerCase().includes(searchLower) ||
        profile.last_name.toLowerCase().includes(searchLower) ||
        (profile.role?.toLowerCase() || '').includes(searchLower) ||
        (profile.grade?.toLowerCase() || '').includes(searchLower) ||
        (profile.rank?.toLowerCase() || '').includes(searchLower) ||
        (profile.flight?.toLowerCase() || '').includes(searchLower);
      
      return isParent && matchesSearch;
    }
    
    // Handle active/inactive tabs - exclude parents
    const isActive = activeSubTab === 'active';
    const matchesActiveStatus = profile.active === isActive && profile.role !== 'parent';
    
    if (!searchTerm) return matchesActiveStatus;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      profile.first_name.toLowerCase().includes(searchLower) ||
      profile.last_name.toLowerCase().includes(searchLower) ||
      (profile.role?.toLowerCase() || '').includes(searchLower) ||
      (profile.grade?.toLowerCase() || '').includes(searchLower) ||
      (profile.rank?.toLowerCase() || '').includes(searchLower) ||
      (profile.flight?.toLowerCase() || '').includes(searchLower);
    
    return matchesActiveStatus && matchesSearch;
  });
};

export const getPaginatedProfiles = (
  profiles: Profile[], 
  currentPage: number
): Profile[] => {
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  return profiles.slice(startIndex, endIndex);
};

export const getTotalPages = (profilesLength: number): number => {
  return Math.ceil(profilesLength / ITEMS_PER_PAGE);
};
