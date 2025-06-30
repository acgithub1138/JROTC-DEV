
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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
  const { userProfile } = useAuth();

  const fetchRules = async () => {
    try {
      if (!userProfile?.school_id) {
        console.log('No school ID available for user');
        setRules([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('business_rules')
        .select('*')
        .eq('school_id', userProfile.school_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedRules: BusinessRule[] = (data || []).map(rule => ({
        ...rule,
        trigger_conditions: Array.isArray(rule.trigger_conditions) ? rule.trigger_conditions : [],
        actions: Array.isArray(rule.actions) ? rule.actions : []
      }));
      
      setRules(transformedRules);
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
      if (!userProfile?.school_id) {
        throw new Error('User school not found');
      }

      const { data, error } = await supabase
        .from('business_rules')
        .insert([{
          ...rule,
          school_id: userProfile.school_id,
          created_by: userProfile.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      const transformedRule: BusinessRule = {
        ...data,
        trigger_conditions: Array.isArray(data.trigger_conditions) ? data.trigger_conditions : [],
        actions: Array.isArray(data.actions) ? data.actions : []
      };
      
      setRules(prev => [transformedRule, ...prev]);
      toast({
        title: 'Success',
        description: 'Business rule created successfully',
      });
      return transformedRule;
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
        .eq('school_id', userProfile?.school_id) // Ensure school isolation
        .select()
        .single();

      if (error) throw error;
      
      const transformedRule: BusinessRule = {
        ...data,
        trigger_conditions: Array.isArray(data.trigger_conditions) ? data.trigger_conditions : [],
        actions: Array.isArray(data.actions) ? data.actions : []
      };
      
      setRules(prev => prev.map(rule => rule.id === id ? transformedRule : rule));
      toast({
        title: 'Success',
        description: 'Business rule updated successfully',
      });
      return transformedRule;
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
        .eq('id', id)
        .eq('school_id', userProfile?.school_id); // Ensure school isolation

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
        .eq('id', id)
        .eq('school_id', userProfile?.school_id); // Ensure school isolation

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
    if (userProfile?.school_id) {
      fetchRules();
    }
  }, [userProfile?.school_id]);

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
