
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BusinessRule } from './types';

export const useBusinessRuleMutations = (
  setRules: React.Dispatch<React.SetStateAction<BusinessRule[]>>
) => {
  const { toast } = useToast();
  const { userProfile } = useAuth();

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
        .eq('school_id', userProfile?.school_id)
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
        .eq('school_id', userProfile?.school_id);

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
        .eq('school_id', userProfile?.school_id);

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

  return {
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
  };
};
