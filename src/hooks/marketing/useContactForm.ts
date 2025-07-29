import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  school: string;
  cadets: string;
  message: string;
  type: string;
}

export const useContactForm = () => {
  const { toast } = useToast();

  const submitContactForm = useMutation({
    mutationFn: async (formData: ContactFormData) => {
      // Insert into contact_us table
      const { data, error } = await supabase
        .from('contact_us')
        .insert([formData])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Message Sent!",
        description: "We'll get back to you within 24 hours.",
      });
    },
    onError: (error: any) => {
      console.error('Error submitting contact form:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again or contact us directly.",
        variant: "destructive",
      });
    },
  });

  return {
    submitContactForm: submitContactForm.mutate,
    isSubmitting: submitContactForm.isPending,
  };
};