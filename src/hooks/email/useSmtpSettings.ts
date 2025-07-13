
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

  const testConnection = useMutation({
    mutationFn: async (testSettings: Omit<SmtpSettings, 'id' | 'school_id' | 'created_at' | 'updated_at' | 'is_global'>) => {
      console.log('🔧 Starting SMTP connection test with settings:', {
        smtp_host: testSettings.smtp_host,
        smtp_port: testSettings.smtp_port,
        smtp_username: testSettings.smtp_username,
        from_email: testSettings.from_email,
        use_tls: testSettings.use_tls,
        // Don't log password for security
        hasPassword: !!testSettings.smtp_password
      });

      try {
        console.log('🔧 Invoking test-smtp-connection edge function...');
        const { data, error } = await supabase.functions.invoke('test-smtp-connection', {
          body: testSettings,
        });

        console.log('🔧 Edge function response:', { data, error });

        if (error) {
          console.error('🔧 Edge function error:', error);
          throw new Error(error.message || 'Failed to test SMTP connection');
        }

        // Check if the response indicates failure even with successful HTTP request
        if (data && !data.success) {
          console.error('🔧 SMTP test failed:', data);
          throw new Error(data.message || 'SMTP connection test failed');
        }

        console.log('🔧 SMTP connection test successful:', data);
        return data;
      } catch (err) {
        console.error('🔧 Exception during SMTP test:', err);
        throw err;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Connection successful",
        description: data?.message || "SMTP connection test passed successfully.",
      });
    },
    onError: (error: any) => {
      console.error('SMTP connection test failed:', error);
      toast({
        title: "Connection failed",
        description: error.message || "SMTP connection test failed.",
        variant: "destructive",
      });
    },
  });

  return {
    settings,
    isLoading,
    createOrUpdateSettings: createOrUpdateSettings.mutate,
    isSaving: createOrUpdateSettings.isPending,
    testConnection: testConnection.mutate,
    isTesting: testConnection.isPending,
  };
};
