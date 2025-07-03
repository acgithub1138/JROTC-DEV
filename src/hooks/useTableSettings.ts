import { useState, useEffect } from 'react';

export type TablePaddingSize = 'compact' | 'normal' | 'comfortable';

interface TableSettings {
  paddingSize: TablePaddingSize;
}

const STORAGE_KEY = 'table-settings';

const defaultSettings: TableSettings = {
  paddingSize: 'compact'
};

const paddingClasses: Record<TablePaddingSize, string> = {
  compact: 'py-1',
  normal: 'py-2', 
  comfortable: 'py-4'
};

export const useTableSettings = () => {
  const [settings, setSettings] = useState<TableSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updatePaddingSize = (paddingSize: TablePaddingSize) => {
    setSettings(prev => ({ ...prev, paddingSize }));
  };

  const getPaddingClass = () => paddingClasses[settings.paddingSize];

  return {
    settings,
    updatePaddingSize,
    getPaddingClass
  };
};