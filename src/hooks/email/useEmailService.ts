import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProcessEmailRulesRequest {
  sourceTable: 'tasks' | 'subtasks' | 'incidents';
  recordId: string;
  schoolId: string;
  operationType: string;
}

export const useEmailService = () => {
  const { toast } = useToast();

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
    processEmailRules: processEmailRules.mutate,
    isProcessingEmailRules: processEmailRules.isPending,
  };
};