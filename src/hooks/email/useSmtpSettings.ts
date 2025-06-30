
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SmtpSettings {
  id?: string;
  school_id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useSmtpSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['smtp-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('smtp_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data;
    },
  });

  const createOrUpdateSettings = useMutation({
    mutationFn: async (settingsData: Omit<SmtpSettings, 'id' | 'school_id' | 'created_at' | 'updated_at'>) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      if (settings?.id) {
        // Update existing settings
        const { data, error } = await supabase
          .from('smtp_settings')
          .update(settingsData)
          .eq('id', settings.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('smtp_settings')
          .insert({
            ...settingsData,
            school_id: profile.school_id,
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
        title: "SMTP settings saved",
        description: "Your email configuration has been updated successfully.",
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
    mutationFn: async (testSettings: Omit<SmtpSettings, 'id' | 'school_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.functions.invoke('test-smtp-connection', {
        body: testSettings,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Connection successful",
        description: "SMTP connection test passed successfully.",
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
