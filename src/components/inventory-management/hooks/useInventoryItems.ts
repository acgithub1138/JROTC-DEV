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
    staleTime: 3 * 60 * 1000, // 3 minutes - inventory changes moderately
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });

  const createMutation = useMutation({
    mutationFn: async (item: Omit<InventoryItemInsert, 'school_id'>) => {
      if (!userProfile?.school_id) throw new Error('No school ID');

      // Validate required fields
      if (!item.item) throw new Error('Item name is required');

      // Set status and school_id (qty_available is auto-calculated by database)
      const itemWithSchoolId = {
        ...item,
        school_id: userProfile.school_id,
        status: item.status || 'available'
      };

      const { data, error } = await supabase
        .from('inventory_items')
        .insert(itemWithSchoolId)
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

      console.log(`Starting bulk creation of ${items.length} items for school:`, userProfile.school_id);
      
      // Add school_id and status for all items (qty_available is auto-calculated by database)
      const itemsWithSchool = items.map((item, index) => {
        const processedItem = {
          ...item,
          school_id: userProfile.school_id,
          status: item.status || 'available'
        };
        console.log(`Item ${index + 1} processed:`, processedItem);
        return processedItem;
      });

      console.log('Final items to insert:', itemsWithSchool);
      const { data, error } = await supabase
        .from('inventory_items')
        .insert(itemsWithSchool)
        .select();

      if (error) {
        console.error('Database insertion error:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('Bulk creation successful, inserted items:', data);
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

      // Remove qty_available from updates as it's a generated column
      const { qty_available, ...finalUpdates } = updates;

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