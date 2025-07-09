
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface EmailRule {
  id: string;
  name: string;
  template_id: string;
  source_table: string;
  trigger_event: 'INSERT' | 'UPDATE' | 'DELETE';
  trigger_conditions: Record<string, any>;
  recipient_config: Record<string, any>;
  is_active: boolean;
  school_id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useEmailRules = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['email-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_rules')
        .select(`
          *,
          email_templates:template_id (
            name,
            subject
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (EmailRule & { email_templates: { name: string; subject: string } })[];
    },
  });

  const createRule = useMutation({
    mutationFn: async (ruleData: Omit<EmailRule, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'school_id'>) => {
      const { data, error } = await supabase
        .from('email_rules')
        .insert({
          ...ruleData,
          created_by: userProfile?.id,
          school_id: userProfile?.school_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-rules'] });
      toast({
        title: "Rule created",
        description: "Email rule has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create email rule.",
        variant: "destructive",
      });
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...ruleData }: Partial<EmailRule> & { id: string }) => {
      // Validate UUID fields to prevent empty string errors
      const cleanedData = { ...ruleData };
      
      // Ensure template_id is never an empty string
      if (cleanedData.template_id === '') {
        delete cleanedData.template_id; // Remove from update if empty, let database keep existing value
      }
      
      const { data, error } = await supabase
        .from('email_rules')
        .update(cleanedData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-rules'] });
      toast({
        title: "Rule updated",
        description: "Email rule has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update email rule.",
        variant: "destructive",
      });
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-rules'] });
      toast({
        title: "Rule deleted",
        description: "Email rule has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete email rule.",
        variant: "destructive",
      });
    },
  });

  return {
    rules,
    isLoading,
    createRule: createRule.mutate,
    updateRule: updateRule.mutate,
    deleteRule: deleteRule.mutate,
    isCreating: createRule.isPending,
    isUpdating: updateRule.isPending,
    isDeleting: deleteRule.isPending,
  };
};
