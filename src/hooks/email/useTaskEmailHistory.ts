import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EmailHistoryItem {
  id: string;
  recipient_email: string;
  subject: string;
  body: string;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled' | 'rate_limited';
  scheduled_at: string;
  sent_at: string | null;
  error_message: string | null;
  template_id: string | null;
  email_templates?: {
    name: string;
  } | null;
}

export const useTaskEmailHistory = (recordId: string) => {
  return useQuery({
    queryKey: ['task-email-history', recordId],
    queryFn: async (): Promise<EmailHistoryItem[]> => {
      // Query for both tasks and subtasks emails for this record
      const { data, error } = await supabase
        .from('email_queue')
        .select(`
          id,
          recipient_email,
          subject,
          body,
          status,
          scheduled_at,
          sent_at,
          error_message,
          template_id,
          source_table,
          email_templates (
            name
          )
        `)
        .eq('record_id', recordId)
        .in('source_table', ['tasks', 'subtasks'])
        .order('scheduled_at', { ascending: false });

      if (error) {
        console.error('Error fetching email history:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!recordId,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};