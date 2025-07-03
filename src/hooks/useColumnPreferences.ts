import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ColumnPreference {
  key: string;
  label: string;
  enabled: boolean;
}

export const useColumnPreferences = (tableName: string, defaultColumns: ColumnPreference[]) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [columns, setColumns] = useState<ColumnPreference[]>(defaultColumns);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from database
  useEffect(() => {
    const loadPreferences = async () => {
      if (!userProfile?.id) return;

      try {
        const { data, error } = await supabase
          .from('user_sidebar_preferences')
          .select(`${tableName}_columns`)
          .eq('user_id', userProfile.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading column preferences:', error);
          return;
        }

        if (data && data[`${tableName}_columns`]) {
          const savedColumnKeys = data[`${tableName}_columns`] as string[];
          const updatedColumns = defaultColumns.map(col => ({
            ...col,
            enabled: savedColumnKeys.includes(col.key)
          }));
          setColumns(updatedColumns);
        }
      } catch (error) {
        console.error('Error loading column preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [userProfile?.id, tableName]);

  // Save preferences to database
  const savePreferences = async (newColumns: ColumnPreference[]) => {
    if (!userProfile?.id) return;

    try {
      const enabledColumns = newColumns.filter(col => col.enabled).map(col => col.key);
      
      const { error } = await supabase
        .from('user_sidebar_preferences')
        .upsert({
          user_id: userProfile.id,
          [`${tableName}_columns`]: enabledColumns
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        throw error;
      }

      setColumns(newColumns);
      toast({
        title: "Success",
        description: "Column preferences saved successfully",
      });
    } catch (error) {
      console.error('Error saving column preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save column preferences",
        variant: "destructive",
      });
    }
  };

  const toggleColumn = (columnKey: string) => {
    const newColumns = columns.map(col =>
      col.key === columnKey ? { ...col, enabled: !col.enabled } : col
    );
    savePreferences(newColumns);
  };

  const enabledColumns = columns.filter(col => col.enabled);

  return {
    columns,
    enabledColumns,
    toggleColumn,
    isLoading
  };
};