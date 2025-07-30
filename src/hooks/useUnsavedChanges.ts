import { useCallback, useEffect, useRef, useState } from 'react';
import { useDeepCompareEffect } from './useDeepCompareEffect';

export interface UseUnsavedChangesOptions<T> {
  initialData: T;
  currentData: T;
  enabled?: boolean;
}

export function useUnsavedChanges<T extends Record<string, any>>({
  initialData,
  currentData,
  enabled = true,
}: UseUnsavedChangesOptions<T>) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialDataRef = useRef<T>(initialData);

  // Update initial data reference when it changes
  useDeepCompareEffect(() => {
    initialDataRef.current = initialData;
    setHasUnsavedChanges(false);
  }, [initialData]);

  // Check for changes when current data changes
  useDeepCompareEffect(() => {
    if (!enabled) {
      setHasUnsavedChanges(false);
      return;
    }

    const hasChanges = Object.keys(currentData).some(key => {
      const initial = initialDataRef.current[key];
      const current = currentData[key];
      
      // Handle null/undefined/empty string comparisons
      const normalizeValue = (value: any) => {
        if (value === null || value === undefined || value === '') {
          return '';
        }
        return value;
      };

      return normalizeValue(initial) !== normalizeValue(current);
    });

    setHasUnsavedChanges(hasChanges);
  }, [currentData, enabled]);

  const resetChanges = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  return {
    hasUnsavedChanges,
    resetChanges,
  };
}