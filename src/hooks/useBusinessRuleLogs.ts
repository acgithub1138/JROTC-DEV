
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface BusinessRuleLog {
  id: string;
  business_rule_id: string;
  executed_at: string;
  trigger_event: string;
  target_table: string;
  target_record_id: string | null;
  action_type: string;
  action_details: any;
  before_values: any;
  after_values: any;
  success: boolean;
  error_message: string | null;
  execution_time_ms: number | null;
  school_id: string;
  business_rule?: {
    name: string;
    description: string;
  };
}

export const useBusinessRuleLogs = () => {
  const [logs, setLogs] = useState<BusinessRuleLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { userProfile } = useAuth();

  const fetchLogs = async (ruleId?: string, limit: number = 100) => {
    try {
      setLoading(true);
      
      if (!userProfile?.school_id) {
        console.log('No school ID available for user');
        setLogs([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('business_rule_logs')
        .select(`
          *,
          business_rule:business_rules(name, description)
        `)
        .eq('school_id', userProfile.school_id)
        .order('executed_at', { ascending: false })
        .limit(limit);

      if (ruleId) {
        query = query.eq('business_rule_id', ruleId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const transformedLogs: BusinessRuleLog[] = (data || []).map(log => ({
        ...log,
        business_rule: Array.isArray(log.business_rule) ? log.business_rule[0] : log.business_rule
      }));

      setLogs(transformedLogs);
    } catch (error) {
      console.error('Error fetching business rule logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch business rule logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getLogsByRule = (ruleId: string) => {
    return logs.filter(log => log.business_rule_id === ruleId);
  };

  const getLogsByTable = (tableName: string) => {
    return logs.filter(log => log.target_table === tableName);
  };

  const getExecutionStats = () => {
    const totalExecutions = logs.length;
    const successfulExecutions = logs.filter(log => log.success).length;
    const failedExecutions = logs.filter(log => !log.success).length;
    const averageExecutionTime = logs.length > 0 
      ? logs.reduce((sum, log) => sum + (log.execution_time_ms || 0), 0) / logs.length 
      : 0;

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
      averageExecutionTime: Math.round(averageExecutionTime)
    };
  };

  useEffect(() => {
    if (userProfile?.school_id) {
      fetchLogs();
    }
  }, [userProfile?.school_id]);

  return {
    logs,
    loading,
    fetchLogs,
    getLogsByRule,
    getLogsByTable,
    getExecutionStats,
    refetch: () => fetchLogs(),
  };
};
