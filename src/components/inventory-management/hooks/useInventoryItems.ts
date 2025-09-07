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

      // Validate required fields
      if (!item.item) throw new Error('Item name is required');

      // Calculate qty_available
      const itemWithCalculatedQty = {
        ...item,
        school_id: userProfile.school_id,
        qty_available: (item.qty_total || 0) - (item.qty_issued || 0)
      };

      const { data, error } = await supabase
        .from('inventory_items')
        .insert(itemWithCalculatedQty)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (items: Omit<InventoryItemInsert, 'school_id'>[]) => {
      if (!userProfile?.school_id) throw new Error('No school ID');

      // Add school_id and calculate qty_available for all items
      const itemsWithSchool = items.map(item => ({
        ...item,
        school_id: userProfile.school_id,
        qty_available: (item.qty_total || 0) - (item.qty_issued || 0)
      }));

      const { data, error } = await supabase
        .from('inventory_items')
        .insert(itemsWithSchool)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: InventoryItemUpdate & { id: string }) => {
      // Validate quantities
      if (updates.qty_total !== undefined && updates.qty_total < 0) {
        throw new Error('Total quantity cannot be negative');
      }
      if (updates.qty_issued !== undefined && updates.qty_issued < 0) {
        throw new Error('Issued quantity cannot be negative');
      }

      // If qty_total or qty_issued are being updated, we need to get current values to recalculate qty_available
      let finalUpdates = { ...updates };
      
      if (updates.qty_total !== undefined || updates.qty_issued !== undefined) {
        // Get current item to calculate new qty_available
        const { data: currentItem } = await supabase
          .from('inventory_items')
          .select('qty_total, qty_issued')
          .eq('id', id)
          .single();

        const newQtyTotal = updates.qty_total !== undefined ? updates.qty_total : (currentItem?.qty_total || 0);
        const newQtyIssued = updates.qty_issued !== undefined ? updates.qty_issued : (currentItem?.qty_issued || 0);
        
        finalUpdates.qty_available = newQtyTotal - newQtyIssued;
      }

      const { data, error } = await supabase
        .from('inventory_items')
        .update(finalUpdates)
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
    bulkCreateItems: bulkCreateMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
  };
};