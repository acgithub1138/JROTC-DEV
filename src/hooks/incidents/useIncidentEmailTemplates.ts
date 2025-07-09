import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface IncidentEmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  is_active: boolean;
}

export const useIncidentEmailTemplates = () => {
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['incident-email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('id, name, subject, body, is_active')
        .eq('source_table', 'incidents')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as IncidentEmailTemplate[];
    },
  });

  return {
    templates,
    isLoading,
  };
};