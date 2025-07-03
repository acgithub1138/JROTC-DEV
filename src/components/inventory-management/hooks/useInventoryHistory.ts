import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type InventoryHistory = Tables<'inventory_history'> & {
  profiles: Pick<Tables<'profiles'>, 'first_name' | 'last_name'> | null;
};

export const useInventoryHistory = (itemId?: string) => {
  return useQuery({
    queryKey: ['inventory-history', itemId],
    queryFn: async () => {
      if (!itemId) return [];
      
      const { data, error } = await supabase
        .from('inventory_history')
        .select(`
          *,
          profiles:changed_by(first_name, last_name)
        `)
        .eq('item_id', itemId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as InventoryHistory[];
    },
    enabled: !!itemId,
  });
};