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
      // Create email body with all form details
      const emailBody = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${formData.name}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Phone:</strong> ${formData.phone || 'Not provided'}</p>
        <p><strong>School/Institution:</strong> ${formData.school}</p>
        <p><strong>Number of Cadets:</strong> ${formData.cadets || 'Not specified'}</p>
        <p><strong>Interest Type:</strong> ${formData.type}</p>
        <p><strong>Additional Information:</strong></p>
        <p>${formData.message || 'No additional message provided'}</p>
        
        <hr>
        <p><em>This message was sent through the JROTC Pro contact form.</em></p>
      `;

      // Insert directly into email queue
      const { data, error } = await supabase
        .from('email_queue')
        .insert({
          recipient_email: 'jrotc_info@careyunlimited.com',
          subject: `New Contact Form Submission from ${formData.name} - ${formData.school}`,
          body: emailBody,
          source_table: 'contact_form',
          school_id: '00000000-0000-0000-0000-000000000000', // Default for marketing contact forms
          scheduled_at: new Date().toISOString(),
          status: 'pending'
        })
        .select()
        .single();

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