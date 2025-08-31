import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProcessCommentEmailRequest {
  sourceTable: 'tasks' | 'subtasks';
  recordId: string;
  schoolId: string;
  commenterId: string;
}

export const useCommentEmailService = () => {
  const { toast } = useToast();

  const processCommentEmailRules = useMutation({
    mutationFn: async (request: ProcessCommentEmailRequest) => {
      const { data, error } = await supabase.rpc('process_comment_email_notification', {
        source_table_param: request.sourceTable,
        record_id_param: request.recordId,
        school_id_param: request.schoolId,
        commenter_id_param: request.commenterId
      });

      if (error) throw error;
      return data;
    },
    onError: (error: any) => {
      console.error('Comment email processing error:', error);
      toast({
        title: "Email Error",
        description: "Failed to process comment email notifications",
        variant: "destructive",
      });
    },
  });

  return {
    processCommentEmailRules: processCommentEmailRules.mutate,
    isProcessingCommentEmailRules: processCommentEmailRules.isPending,
  };
};