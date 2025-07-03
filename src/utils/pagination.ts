import { ITEMS_PER_PAGE } from '@/constants/pagination';

export const getPaginatedItems = <T>(
  items: T[], 
  currentPage: number
): T[] => {
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  return items.slice(startIndex, endIndex);
};

export const getTotalPages = (itemsLength: number): number => {
  return Math.ceil(itemsLength / ITEMS_PER_PAGE);
};