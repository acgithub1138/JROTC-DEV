
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { useState, useMemo } from 'react';
import { EmailBuilderDocument } from '@/components/email-builder';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  body_json?: EmailBuilderDocument | null;
  editor_type?: 'legacy' | 'builder';
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
  const { canView, canViewDetails, canEdit, canDelete, canCreate } = useTablePermissions('email_templates');
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

    // Show templates based on email view permission
    // Users with email view permission can see global templates and their school's templates
    if (canView) {
      filtered = filtered.filter(template => 
        template.school_id === null || // Global templates
        template.school_id === userProfile?.school_id // School-specific templates
      );
    } else {
      // No permission - show empty list
      filtered = [];
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
  }, [templates, searchQuery, showOnlyMyTemplates, userProfile?.school_id, canView]);

  const createTemplate = useMutation({
    mutationFn: async (templateData: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'school_id'>) => {
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          ...templateData,
          body_json: templateData.body_json || null,
          editor_type: templateData.editor_type || 'builder',
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
        body_json: templateData.body_json || null,
        editor_type: templateData.editor_type,
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
        body_json: originalTemplate.body_json || null,
        editor_type: originalTemplate.editor_type || 'legacy',
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
    if (!userProfile || !canEdit) return false;
    
    // Admins can edit any template
    if (userProfile.role === 'admin') return true;
    
    // Cannot edit global templates (null school_id)
    if (template.school_id === null) return false;
    
    // Users with edit permission can only edit templates from their school
    return template.school_id === userProfile.school_id;
  };

  const canCopyTemplate = (template: EmailTemplate): boolean => {
    if (!userProfile || !canCreate) return false;
    
    // Can copy any template they can see (global or school templates)
    return true;
  };

  const canDeleteTemplate = (template: EmailTemplate): boolean => {
    if (!userProfile || !canDelete) return false;
    
    // Admins can delete any template
    if (userProfile.role === 'admin') return true;
    
    // Cannot delete global templates (null school_id)
    if (template.school_id === null) return false;
    
    // Users with delete permission can only delete templates from their school
    return template.school_id === userProfile.school_id;
  };

  const canViewTemplate = (template: EmailTemplate): boolean => {
    if (!userProfile || !canViewDetails) return false;
    
    // Can view any template they can see (global or school templates)
    return true;
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
    canDeleteTemplate,
    canViewTemplate,
    canCreate,
    isCreating: createTemplate.isPending,
    isUpdating: updateTemplate.isPending,
    isDeleting: deleteTemplate.isPending,
    isCopying: copyTemplate.isPending,
  };
};
