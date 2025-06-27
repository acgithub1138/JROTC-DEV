
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_table?: string;
  trigger_conditions: any[];
  actions: any[];
  is_active: boolean;
  school_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  last_executed?: string;
}

export const useBusinessRules = () => {
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('business_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching business rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch business rules',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createRule = async (rule: Omit<BusinessRule, 'id' | 'created_at' | 'updated_at' | 'school_id'>) => {
    try {
      const { data, error } = await supabase
        .from('business_rules')
        .insert([rule])
        .select()
        .single();

      if (error) throw error;
      
      setRules(prev => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Business rule created successfully',
      });
      return data;
    } catch (error) {
      console.error('Error creating business rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to create business rule',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateRule = async (id: string, updates: Partial<BusinessRule>) => {
    try {
      const { data, error } = await supabase
        .from('business_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setRules(prev => prev.map(rule => rule.id === id ? data : rule));
      toast({
        title: 'Success',
        description: 'Business rule updated successfully',
      });
      return data;
    } catch (error) {
      console.error('Error updating business rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update business rule',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('business_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setRules(prev => prev.filter(rule => rule.id !== id));
      toast({
        title: 'Success',
        description: 'Business rule deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting business rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete business rule',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const toggleRule = async (id: string, is_active: boolean) => {
    try {
      const { error } = await supabase
        .from('business_rules')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
      
      setRules(prev => prev.map(rule => 
        rule.id === id ? { ...rule, is_active } : rule
      ));
      toast({
        title: 'Success',
        description: `Business rule ${is_active ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling business rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle business rule',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  return {
    rules,
    loading,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    refetch: fetchRules,
  };
};
