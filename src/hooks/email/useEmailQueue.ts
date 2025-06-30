
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmailQueueItem {
  id: string;
  template_id: string | null;
  rule_id: string | null;
  recipient_email: string;
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  scheduled_at: string;
  sent_at: string | null;
  error_message: string | null;
  record_id: string | null;
  source_table: string | null;
  school_id: string;
  created_at: string;
  updated_at: string;
  email_templates?: { name: string; subject: string } | null;
  email_rules?: { name: string } | null;
}

export const useEmailQueue = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: queueItems = [], isLoading } = useQuery({
    queryKey: ['email-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_queue')
        .select(`
          *,
          email_templates:template_id (
            name,
            subject
          ),
          email_rules:rule_id (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EmailQueueItem[];
    },
  });

  const retryEmail = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('email_queue')
        .update({ 
          status: 'pending',
          error_message: null,
          scheduled_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-queue'] });
      toast({
        title: "Email queued for retry",
        description: "The email has been queued for retry.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to retry email.",
        variant: "destructive",
      });
    },
  });

  const cancelEmail = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('email_queue')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-queue'] });
      toast({
        title: "Email cancelled",
        description: "The email has been cancelled.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel email.",
        variant: "destructive",
      });
    },
  });

  return {
    queueItems,
    isLoading,
    retryEmail: retryEmail.mutate,
    cancelEmail: cancelEmail.mutate,
    isRetrying: retryEmail.isPending,
    isCancelling: cancelEmail.isPending,
  };
};
