
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useMemo } from 'react';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  source_table: string;
  recipient_field: string;
  variables_used: string[];
  is_active: boolean;
  is_global?: boolean;
  created_by: string | null;
  school_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useEmailTemplates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();
  const [showOnlyMyTemplates, setShowOnlyMyTemplates] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as EmailTemplate[];
    },
  });

  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Filter out system templates (where school_id is null) - but admins can see all
    if (userProfile?.role !== 'admin') {
      filtered = filtered.filter(template => template.school_id !== null);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.subject.toLowerCase().includes(query) ||
        template.source_table.toLowerCase().includes(query)
      );
    }

    // Filter by ownership
    if (showOnlyMyTemplates) {
      filtered = filtered.filter(template => 
        template.school_id === userProfile?.school_id
      );
    }

    return filtered;
  }, [templates, searchQuery, showOnlyMyTemplates, userProfile?.school_id, userProfile?.role]);

  const createTemplate = useMutation({
    mutationFn: async (templateData: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'school_id'>) => {
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          ...templateData,
          created_by: userProfile?.id,
          school_id: templateData.is_global ? null : userProfile?.school_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast({
        title: "Template created",
        description: "Email template has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create email template.",
        variant: "destructive",
      });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...templateData }: Partial<EmailTemplate> & { id: string }) => {
      const updateData = {
        ...templateData,
        school_id: templateData.is_global ? null : (templateData.school_id || userProfile?.school_id)
      };
      
      const { data, error } = await supabase
        .from('email_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast({
        title: "Template updated",
        description: "Email template has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update email template.",
        variant: "destructive",
      });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast({
        title: "Template deleted",
        description: "Email template has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete email template.",
        variant: "destructive",
      });
    },
  });

  const copyTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const originalTemplate = templates.find(t => t.id === templateId);
      if (!originalTemplate) throw new Error('Template not found');

      const copyData = {
        name: `${originalTemplate.name} (Copy)`,
        subject: originalTemplate.subject,
        body: originalTemplate.body,
        source_table: originalTemplate.source_table,
        recipient_field: originalTemplate.recipient_field,
        variables_used: originalTemplate.variables_used,
        is_active: originalTemplate.is_active,
        is_global: false, // Always create as school-specific
      };

      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          ...copyData,
          created_by: userProfile?.id,
          school_id: userProfile?.school_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast({
        title: "Template copied",
        description: "Email template has been copied successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to copy email template.",
        variant: "destructive",
      });
    },
  });

  const toggleMyTemplatesFilter = (value: boolean) => {
    setShowOnlyMyTemplates(value);
  };

  const canEditTemplate = (template: EmailTemplate): boolean => {
    if (!userProfile) return false;
    
    // Cannot edit system templates (null school_id)
    if (template.school_id === null) return false;
    
    // Admins can edit any template
    if (userProfile.role === 'admin') return true;
    
    // Users can only edit school-specific templates from their school
    return !template.is_global && template.school_id === userProfile.school_id;
  };

  const canCopyTemplate = (template: EmailTemplate): boolean => {
    // Cannot copy system templates (null school_id)
    if (template.school_id === null) return false;
    
    return !!userProfile; // Any authenticated user can copy templates
  };

  return {
    templates: filteredTemplates,
    isLoading,
    showOnlyMyTemplates,
    searchQuery,
    setSearchQuery,
    createTemplate: createTemplate.mutate,
    updateTemplate: updateTemplate.mutate,
    deleteTemplate: deleteTemplate.mutate,
    copyTemplate: copyTemplate.mutate,
    toggleMyTemplatesFilter,
    canEditTemplate,
    canCopyTemplate,
    isCreating: createTemplate.isPending,
    isUpdating: updateTemplate.isPending,
    isDeleting: deleteTemplate.isPending,
    isCopying: copyTemplate.isPending,
  };
};
