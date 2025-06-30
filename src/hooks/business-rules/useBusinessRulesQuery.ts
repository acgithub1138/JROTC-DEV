
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { BusinessRule } from './types';

export const useBusinessRulesQuery = () => {
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

  useEffect(() => {
    if (userProfile?.school_id) {
      fetchRules();
    }
  }, [userProfile?.school_id]);

  return {
    rules,
    loading,
    fetchRules,
    setRules,
  };
};
