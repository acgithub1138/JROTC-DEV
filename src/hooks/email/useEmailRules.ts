
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface EmailRule {
  id: string;
  school_id: string;
  rule_type: 'task_created' | 'task_information_needed' | 'task_completed' | 'task_canceled' | 'subtask_created' | 'subtask_information_needed' | 'subtask_completed' | 'subtask_canceled';
  template_id: string | null;
  is_active: boolean;
  trigger_event: 'INSERT' | 'UPDATE';
  created_at: string;
  updated_at: string;
}

export type RuleType = EmailRule['rule_type'];

export const RULE_LABELS: Record<RuleType, string> = {
  task_created: 'Task Created',
  task_information_needed: 'Task Information Needed',
  task_completed: 'Task Completed',
  task_canceled: 'Task Canceled',
  subtask_created: 'Subtask Created',
  subtask_information_needed: 'Subtask Information Needed',
  subtask_completed: 'Subtask Completed',
  subtask_canceled: 'Subtask Canceled',
};

export const RULE_DESCRIPTIONS: Record<RuleType, string> = {
  task_created: 'Triggered when a new task is created',
  task_information_needed: 'Triggered when a task status is set to Need Information',
  task_completed: 'Triggered when a task status is set to Completed',
  task_canceled: 'Triggered when a task status is set to Canceled',
  subtask_created: 'Triggered when a new subtask is created',
  subtask_information_needed: 'Triggered when a subtask status is set to Need Information',
  subtask_completed: 'Triggered when a subtask status is set to Completed',
  subtask_canceled: 'Triggered when a subtask status is set to Canceled',
};

export const useEmailRules = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['email-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_rules')
        .select('*')
        .order('rule_type');

      if (error) throw error;
      return data as EmailRule[];
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ 
      id, 
      is_active, 
      template_id 
    }: { 
      id: string; 
      is_active?: boolean; 
      template_id?: string | null; 
    }) => {
      const updateData: any = {};
      
      if (is_active !== undefined) {
        updateData.is_active = is_active;
      }
      
      if (template_id !== undefined) {
        updateData.template_id = template_id;
      }

      const { data, error } = await supabase
        .from('email_rules')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-rules'] });
      toast({
        title: "Rule updated",
        description: "Email rule has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update email rule.",
        variant: "destructive",
      });
    },
  });

  return {
    rules,
    isLoading,
    updateRule: updateRule.mutate,
    isUpdating: updateRule.isPending,
  };
};
