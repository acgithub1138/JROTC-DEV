import { useState, useMemo } from 'react';
import { SortConfig } from '@/components/ui/sortable-table';

export interface UseSortableTableProps<T> {
  data: T[];
  defaultSort?: SortConfig;
  customSortFn?: (a: T, b: T, sortConfig: SortConfig) => number;
}

export const useSortableTable = <T extends Record<string, any>>({
  data,
  defaultSort,
  customSortFn
}: UseSortableTableProps<T>) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(defaultSort || null);

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  };

  const sortedData = useMemo(() => {
    if (!sortConfig || !data) return data;

    return [...data].sort((a, b) => {
      // Use custom sort function if provided
      if (customSortFn) {
        return customSortFn(a, b, sortConfig);
      }

      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      // Handle date comparison
      if (aValue instanceof Date && bValue instanceof Date) {
        const comparison = aValue.getTime() - bValue.getTime();
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      // Handle numeric and other comparisons
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig, customSortFn]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        // If clicking the same column, toggle direction or clear sort
        return current.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      // If clicking a new column, start with ascending
      return { key, direction: 'asc' };
    });
  };

  const clearSort = () => {
    setSortConfig(null);
  };

  return {
    sortedData,
    sortConfig,
    handleSort,
    clearSort,
    setSortConfig
  };
};