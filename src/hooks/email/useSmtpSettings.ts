
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SmtpSettings {
  id?: string;
  school_id?: string | null;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
  is_active: boolean;
  is_global: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useSmtpSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['smtp-settings'],
    queryFn: async () => {
      // First try to get global settings
      const { data: globalSettings, error: globalError } = await supabase
        .from('smtp_settings')
        .select('*')
        .eq('is_global', true)
        .single();

      if (globalError && globalError.code !== 'PGRST116') {
        throw globalError;
      }

      if (globalSettings) {
        // Decrypt the password using the function
        const { data: decryptedPassword, error: decryptError } = await supabase
          .rpc('decrypt_smtp_password', { 
            encrypted_password: globalSettings.smtp_password 
          });

        if (decryptError) {
          console.error('Error decrypting password:', decryptError);
          // If decryption fails, just return the settings with the encrypted password
          return globalSettings;
        }

        // Replace encrypted password with decrypted one for frontend use
        globalSettings.smtp_password = decryptedPassword;
      }

      return globalSettings;
    },
  });

  const createOrUpdateSettings = useMutation({
    mutationFn: async (settingsData: Omit<SmtpSettings, 'id' | 'school_id' | 'created_at' | 'updated_at' | 'is_global'>) => {
      if (settings?.id) {
        // Update existing global settings
        const { data, error } = await supabase
          .from('smtp_settings')
          .update({
            ...settingsData,
            is_global: true,
            school_id: null
          })
          .eq('id', settings.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new global settings
        const { data, error } = await supabase
          .from('smtp_settings')
          .insert({
            ...settingsData,
            is_global: true,
            school_id: null
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smtp-settings'] });
      toast({
        title: "Global SMTP settings saved",
        description: "The global email configuration has been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Error saving SMTP settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save SMTP settings.",
        variant: "destructive",
      });
    },
  });

  const sendTestEmail = useMutation({
    mutationFn: async (testEmail: string) => {
      console.log('📧 Sending test email to:', testEmail);
      
      if (!testEmail || !testEmail.includes('@')) {
        throw new Error('Please provide a valid email address');
      }

      // Create a test email in the queue
      const { data, error } = await supabase
        .from('email_queue')
        .insert({
          recipient_email: testEmail,
          subject: 'SMTP Test Email - System Configuration',
          body: `
            <h2>SMTP Configuration Test</h2>
            <p>This is a test email sent from your JROTC system to verify that the SMTP configuration is working correctly.</p>
            <p><strong>Test sent at:</strong> ${new Date().toLocaleString()}</p>
            <p>If you received this email, your SMTP settings are working properly!</p>
            <hr>
            <p><small>This is an automated test message from the JROTC system.</small></p>
          `,
          school_id: settings?.school_id || 'c0bae42f-9369-4575-b158-926246145b0a', // Fallback to current school
          status: 'pending',
          scheduled_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log('📧 Test email queued:', data.id);

      // Process the email queue to send the test email
      const { data: processResult, error: processError } = await supabase.functions.invoke('process-email-queue');
      
      if (processError) throw processError;
      
      console.log('📧 Email processing result:', processResult);
      return { emailId: data.id, processResult };
    },
    onSuccess: (data) => {
      toast({
        title: "Test email sent",
        description: `Test email has been sent successfully. Check your inbox!`,
      });
    },
    onError: (error: any) => {
      console.error('Failed to send test email:', error);
      toast({
        title: "Test email failed",
        description: error.message || "Failed to send test email.",
        variant: "destructive",
      });
    },
  });

  return {
    settings,
    isLoading,
    createOrUpdateSettings: createOrUpdateSettings.mutate,
    isSaving: createOrUpdateSettings.isPending,
    sendTestEmail: sendTestEmail.mutate,
    isTesting: sendTestEmail.isPending,
  };
};
