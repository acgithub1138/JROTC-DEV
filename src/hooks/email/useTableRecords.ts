
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useTableRecords = (tableName: string, limit: number = 20) => {
  return useQuery({
    queryKey: ['table-records', tableName, limit],
    queryFn: async () => {
      if (!tableName) return [];
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(limit)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tableName,
  });
};
