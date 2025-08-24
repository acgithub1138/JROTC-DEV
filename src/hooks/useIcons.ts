import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface Icon {
  id: string;
  name: string;
  category: string;
  description?: string;
  is_active: boolean;
  usage_count: number;
}

export const useIcons = () => {
  const [icons, setIcons] = useState<Icon[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchIcons = async () => {
    try {
      const { data, error } = await supabase
        .from('icons')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('name')
        .range(0, 2000); // Fetch up to 2000 icons to ensure we get all of them

      if (error) throw error;
      
      setIcons(data || []);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data?.map(icon => icon.category) || [])];
      setCategories(uniqueCategories.sort());
    } catch (error) {
      console.error('Error fetching icons:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch icons',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const incrementUsage = async (iconName: string) => {
    try {
      const { error } = await supabase
        .from('icons')
        .update({ usage_count: icons.find(i => i.name === iconName)?.usage_count! + 1 })
        .eq('name', iconName);

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing icon usage:', error);
    }
  };

  useEffect(() => {
    fetchIcons();
  }, []);

  return {
    icons,
    categories,
    loading,
    incrementUsage,
    refetch: fetchIcons,
  };
};