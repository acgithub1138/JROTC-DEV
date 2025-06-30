
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EmailLog {
  id: string;
  queue_id: string;
  event_type: 'queued' | 'sent' | 'failed' | 'opened' | 'clicked';
  event_data: Record<string, any>;
  created_at: string;
  email_queue: {
    recipient_email: string;
    subject: string;
    status: string;
  };
}

export const useEmailLogs = () => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['email-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_logs')
        .select(`
          *,
          email_queue!inner (
            recipient_email,
            subject,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EmailLog[];
    },
  });

  return {
    logs,
    isLoading,
  };
};
