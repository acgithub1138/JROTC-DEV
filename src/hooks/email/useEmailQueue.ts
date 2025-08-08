
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWindowFocus } from '@/hooks/useWindowFocus';

export interface EmailQueueItem {
  id: string;
  template_id: string | null;
  rule_id: string | null;
  recipient_email: string;
  subject: string;
  body: string;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled' | 'rate_limited';
  scheduled_at: string;
  sent_at: string | null;
  error_message: string | null;
  record_id: string | null;
  source_table: string | null;
  school_id: string;
  created_at: string;
  updated_at: string;
  retry_count?: number;
  max_retries?: number;
  next_retry_at?: string | null;
  last_attempt_at?: string | null;
  email_templates?: { name: string; subject: string } | null;
}

export const useEmailQueue = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isWindowFocused = useWindowFocus();

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
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as EmailQueueItem[];
    },
    refetchInterval: isWindowFocused ? 60000 : false, // Reduced from 30s to 60s, pause when window not focused
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
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

  const deleteEmail = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_queue')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-queue'] });
      toast({
        title: "Email deleted",
        description: "The email has been deleted from the queue.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete email.",
        variant: "destructive",
      });
    },
  });

  return {
    queueItems,
    isLoading,
    retryEmail: retryEmail.mutate,
    cancelEmail: cancelEmail.mutate,
    deleteEmail: deleteEmail.mutate,
    isRetrying: retryEmail.isPending,
    isCancelling: cancelEmail.isPending,
    isDeleting: deleteEmail.isPending,
  };
};
