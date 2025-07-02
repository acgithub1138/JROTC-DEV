import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type InventoryItem = Tables<'inventory_items'>;
type InventoryItemInsert = TablesInsert<'inventory_items'>;
type InventoryItemUpdate = TablesUpdate<'inventory_items'>;

export const useInventoryItems = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: inventoryItems,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['inventory-items', userProfile?.school_id],
    queryFn: async () => {
      if (!userProfile?.school_id) return [];

      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('school_id', userProfile.school_id)
        .order('item');

      if (error) throw error;
      return data as InventoryItem[];
    },
    enabled: !!userProfile?.school_id,
  });

  const createMutation = useMutation({
    mutationFn: async (item: Omit<InventoryItemInsert, 'school_id'>) => {
      if (!userProfile?.school_id) throw new Error('No school ID');

      const { data, error } = await supabase
        .from('inventory_items')
        .insert({ ...item, school_id: userProfile.school_id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: InventoryItemUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    },
  });

  return {
    inventoryItems,
    isLoading,
    error,
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
  };
};