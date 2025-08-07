import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

export const useInventoryCategories = () => {
  const { userProfile } = useAuth();

  const {
    data: categories,
    isLoading: isCategoriesLoading,
  } = useQuery({
    queryKey: ['inventory-categories', userProfile?.school_id],
    queryFn: async () => {
      if (!userProfile?.school_id) return [];

      const { data, error } = await supabase
        .from('inventory_items')
        .select('category')
        .eq('school_id', userProfile.school_id)
        .not('category', 'is', null);

      if (error) throw error;
      
      // Get unique categories
      const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))];
      return uniqueCategories.sort();
    },
    enabled: !!userProfile?.school_id,
  });

  const {
    data: subCategories,
    isLoading: isSubCategoriesLoading,
  } = useQuery({
    queryKey: ['inventory-subcategories', userProfile?.school_id],
    queryFn: async () => {
      if (!userProfile?.school_id) return [];

      const { data, error } = await supabase
        .from('inventory_items')
        .select('sub_category')
        .eq('school_id', userProfile.school_id)
        .not('sub_category', 'is', null);

      if (error) throw error;
      
      // Get unique subcategories
      const uniqueSubCategories = [...new Set(data.map(item => item.sub_category).filter(Boolean))];
      return uniqueSubCategories.sort();
    },
    enabled: !!userProfile?.school_id,
  });

  // Memoized function to get subcategories for a specific category
  const getSubCategoriesForCategory = useCallback(async (category: string) => {
    if (!userProfile?.school_id || !category) return [];

    const { data, error } = await supabase
      .from('inventory_items')
      .select('sub_category')
      .eq('school_id', userProfile.school_id)
      .eq('category', category)
      .not('sub_category', 'is', null);

    if (error) throw error;
    
    const uniqueSubCategories = [...new Set(data.map(item => item.sub_category).filter(Boolean))];
    return uniqueSubCategories.sort();
  }, [userProfile?.school_id]);

  return {
    categories: categories || [],
    subCategories: subCategories || [],
    isCategoriesLoading,
    isSubCategoriesLoading,
    getSubCategoriesForCategory,
  };
};