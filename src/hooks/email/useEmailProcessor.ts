
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useEmailProcessor = () => {
  const { toast } = useToast();

  const processEmailQueue = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('process-email-queue');

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log('Email processing result:', data);
      toast({
        title: "Email queue processed",
        description: `Processed ${data.processed} emails, ${data.failed} failed.`,
      });
    },
    onError: (error: any) => {
      console.error('Error processing email queue:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process email queue.",
        variant: "destructive",
      });
    },
  });

  return {
    processEmailQueue: processEmailQueue.mutate,
    isProcessing: processEmailQueue.isPending,
  };
};
