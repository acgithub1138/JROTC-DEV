import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailQueueRequest {
  templateId: string;
  recipientEmail: string;
  sourceTable: 'tasks' | 'subtasks' | 'incidents';
  recordId: string;
  schoolId: string;
  ruleId?: string;
}

interface ProcessEmailRulesRequest {
  sourceTable: 'tasks' | 'subtasks' | 'incidents';
  recordId: string;
  schoolId: string;
  operationType: string;
}

export const useEmailService = () => {
  const { toast } = useToast();

  const queueEmail = useMutation({
    mutationFn: async (request: EmailQueueRequest) => {
      const { data, error } = await supabase.rpc('queue_email', {
        template_id_param: request.templateId,
        recipient_email_param: request.recipientEmail,
        source_table_param: request.sourceTable,
        record_id_param: request.recordId,
        school_id_param: request.schoolId,
        rule_id_param: request.ruleId || null
      });

      if (error) throw error;
      return data;
    },
    onError: (error: any) => {
      console.error('Email queue error:', error);
      toast({
        title: "Email Error",
        description: "Failed to queue email notification",
        variant: "destructive",
      });
    },
  });

  const processEmailRules = useMutation({
    mutationFn: async (request: ProcessEmailRulesRequest) => {
      const { data, error } = await supabase.rpc('process_email_rules_manual', {
        source_table_param: request.sourceTable,
        record_id_param: request.recordId,
        school_id_param: request.schoolId,
        operation_type_param: request.operationType
      });

      if (error) throw error;
      return data;
    },
    onError: (error: any) => {
      console.error('Email processing error:', error);
      toast({
        title: "Email Error",
        description: "Failed to process email notifications",
        variant: "destructive",
      });
    },
  });

  return {
    queueEmail: queueEmail.mutate,
    isQueuingEmail: queueEmail.isPending,
    processEmailRules: processEmailRules.mutate,
    isProcessingEmailRules: processEmailRules.isPending,
  };
};