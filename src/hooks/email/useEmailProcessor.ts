
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
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        context: error.context,
        stack: error.stack
      });
      
      let errorMessage = "Failed to process email queue.";
      
      if (error.name === 'FunctionsFetchError') {
        errorMessage = "Unable to connect to email service. Please check your connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return {
    processEmailQueue: processEmailQueue.mutate,
    isProcessing: processEmailQueue.isPending,
  };
};
