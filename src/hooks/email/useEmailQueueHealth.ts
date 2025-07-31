import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWindowFocus } from '@/hooks/useWindowFocus';

export interface EmailQueueHealth {
  id: string;
  school_id: string;
  check_timestamp: string;
  pending_count: number;
  stuck_count: number;
  failed_count: number;
  processing_time_avg_ms: number | null;
  health_status: 'healthy' | 'warning' | 'critical';
  created_at: string;
}

export interface QueueStats {
  school_id: string;
  health_status: string;
  pending_count: number;
  stuck_count: number;
  failed_count: number;
}

export interface RetryResult {
  email_id: string;
  school_id: string;
  retry_count: number;
}

export interface BatchProcessResult {
  processed_count: number;
  failed_count: number;
  details: any;
}

export const useEmailQueueHealth = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isWindowFocused = useWindowFocus();

  // Get health history
  const { data: healthHistory = [], isLoading: isLoadingHealth } = useQuery({
    queryKey: ['email-queue-health'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_queue_health')
        .select('*')
        .order('check_timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as EmailQueueHealth[];
    },
    refetchInterval: isWindowFocused ? 120000 : false, // Reduced from 30s to 2 minutes, pause when window not focused
    staleTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: false,
  });

  // Check current queue health
  const checkQueueHealth = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('check_email_queue_health');
      if (error) throw error;
      return data as QueueStats[];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-queue-health'] });
      queryClient.invalidateQueries({ queryKey: ['email-queue'] });
      
      const criticalSchools = data.filter(s => s.health_status === 'critical');
      const warningSchools = data.filter(s => s.health_status === 'warning');
      
      if (criticalSchools.length > 0) {
        toast({
          title: "Critical Queue Issues",
          description: `${criticalSchools.length} school(s) have critical email queue issues`,
          variant: "destructive",
        });
      } else if (warningSchools.length > 0) {
        toast({
          title: "Queue Warnings",
          description: `${warningSchools.length} school(s) have email queue warnings`,
        });
      } else {
        toast({
          title: "Queue Health Check Complete",
          description: "All email queues are healthy",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Health Check Failed",
        description: error.message || "Failed to check queue health",
        variant: "destructive",
      });
    },
  });

  // Retry stuck emails
  const retryStuckEmails = useMutation({
    mutationFn: async (maxAgeMinutes: number = 10) => {
      const { data, error } = await supabase.rpc('retry_stuck_emails', {
        max_age_minutes: maxAgeMinutes
      });
      if (error) throw error;
      return data as RetryResult[];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-queue'] });
      queryClient.invalidateQueries({ queryKey: ['email-queue-health'] });
      
      if (data.length > 0) {
        toast({
          title: "Emails Retried",
          description: `Successfully retried ${data.length} stuck email(s)`,
        });
      } else {
        toast({
          title: "No Stuck Emails",
          description: "No stuck emails found to retry",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Retry Failed",
        description: error.message || "Failed to retry stuck emails",
        variant: "destructive",
      });
    },
  });

  // Process email batch
  const processBatch = useMutation({
    mutationFn: async (batchSize: number = 10) => {
      const { data, error } = await supabase.rpc('process_email_batch', {
        batch_size: batchSize
      });
      if (error) throw error;
      return data[0] as BatchProcessResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-queue'] });
      
      toast({
        title: "Batch Processing Complete",
        description: `Processed: ${data.processed_count}, Failed: ${data.failed_count}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Batch Processing Failed",
        description: error.message || "Failed to process email batch",
        variant: "destructive",
      });
    },
  });

  return {
    healthHistory,
    isLoadingHealth,
    checkQueueHealth: checkQueueHealth.mutate,
    retryStuckEmails: retryStuckEmails.mutate,
    processBatch: processBatch.mutate,
    isCheckingHealth: checkQueueHealth.isPending,
    isRetrying: retryStuckEmails.isPending,
    isProcessingBatch: processBatch.isPending,
  };
};