import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EmailHistoryItem {
  id: string;
  recipient_email: string;
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled' | 'rate_limited';
  scheduled_at: string;
  sent_at: string | null;
  error_message: string | null;
  template_id: string | null;
  email_templates?: {
    name: string;
  } | null;
}

export const useTaskEmailHistory = (taskId: string) => {
  return useQuery({
    queryKey: ['task-email-history', taskId],
    queryFn: async (): Promise<EmailHistoryItem[]> => {
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
          email_templates (
            name
          )
        `)
        .eq('record_id', taskId)
        .eq('source_table', 'tasks')
        .order('scheduled_at', { ascending: false });

      if (error) {
        console.error('Error fetching task email history:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!taskId,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};