
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface EmailRule {
  id: string;
  school_id: string;
  rule_type: 'task_created' | 'task_information_needed' | 'task_completed' | 'task_canceled' | 'task_overdue_reminder' | 'task_comment_added' | 'subtask_created' | 'subtask_information_needed' | 'subtask_completed' | 'subtask_canceled' | 'subtask_overdue_reminder' | 'subtask_comment_added';
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
  task_overdue_reminder: 'Task Overdue Reminder',
  task_comment_added: 'Task Comment Added',
  subtask_created: 'Subtask Created',
  subtask_information_needed: 'Subtask Information Needed',
  subtask_completed: 'Subtask Completed',
  subtask_canceled: 'Subtask Canceled',
  subtask_overdue_reminder: 'Subtask Overdue Reminder',
  subtask_comment_added: 'Subtask Comment Added',
};

export const RULE_DESCRIPTIONS: Record<RuleType, string> = {
  task_created: 'Triggered when a new task is created',
  task_information_needed: 'Triggered when a task status is set to Need Information',
  task_completed: 'Triggered when a task status is set to Completed',
  task_canceled: 'Triggered when a task status is set to Canceled',
  task_overdue_reminder: 'Send reminder emails 3, 2, 1 days before and on due date at 10am',
  task_comment_added: 'Triggered when a comment is added to a task',
  subtask_created: 'Triggered when a new subtask is created',
  subtask_information_needed: 'Triggered when a subtask status is set to Need Information',
  subtask_completed: 'Triggered when a subtask status is set to Completed',
  subtask_canceled: 'Triggered when a subtask status is set to Canceled',
  subtask_overdue_reminder: 'Send reminder emails 3, 2, 1 days before and on due date at 10am',
  subtask_comment_added: 'Triggered when a comment is added to a subtask',
};

export const useEmailRules = (schoolId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['email-rules', schoolId],
    queryFn: async () => {
      // Don't fetch if no school is selected for admin users
      if (!schoolId) {
        return [];
      }

      let query = supabase
        .from('email_rules')
        .select('*');

      // For admin users, filter by selected school
      if (userProfile?.role === 'admin' && schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error } = await query.order('rule_type');

      if (error) throw error;
      return data as EmailRule[];
    },
    enabled: !!schoolId, // Only run query when schoolId is provided
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
