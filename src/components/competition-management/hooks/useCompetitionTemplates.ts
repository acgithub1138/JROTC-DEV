import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type CompetitionTemplate = Database['public']['Tables']['competition_templates']['Row'];
type CompetitionTemplateInsert = Database['public']['Tables']['competition_templates']['Insert'];
type CompetitionTemplateUpdate = Database['public']['Tables']['competition_templates']['Update'];

export const useCompetitionTemplates = () => {
  const { userProfile } = useAuth();
  const [templates, setTemplates] = useState<CompetitionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnlyMyTemplates, setShowOnlyMyTemplates] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTemplates = async (myTemplatesOnly = false) => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('competition_templates')
        .select('*')
        .eq('is_active', true);

      if (myTemplatesOnly) {
        query = query.eq('school_id', userProfile?.school_id);
      }

      const { data, error } = await query.order('template_name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async (templateData: CompetitionTemplateInsert) => {
    try {
      const user = await supabase.auth.getUser();
      const dataWithMeta = {
        ...templateData,
        created_by: user.data.user?.id,
        school_id: templateData.is_global ? null : userProfile?.school_id
      };

      const { data, error } = await supabase
        .from('competition_templates')
        .insert(dataWithMeta)
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => [data, ...prev]);
      toast.success('Template created successfully');
      return data;
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
      throw error;
    }
  };

  const updateTemplate = async (id: string, updates: CompetitionTemplateUpdate) => {
    try {
      const { data, error } = await supabase
        .from('competition_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => 
        prev.map(template => template.id === id ? data : template)
      );
      toast.success('Template updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
      throw error;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      console.log('Attempting to delete template:', id);
      console.log('User profile:', userProfile);
      
      const { error } = await supabase
        .from('competition_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      setTemplates(prev => prev.filter(template => template.id !== id));
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error(`Failed to delete template: ${error.message}`);
      throw error;
    }
  };

  const copyTemplate = async (templateId: string) => {
    try {
      // First fetch the template to copy
      const { data: originalTemplate, error: fetchError } = await supabase
        .from('competition_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (fetchError) throw fetchError;

      // Create a new template with copied data
      const user = await supabase.auth.getUser();
      const newTemplate = {
        template_name: `${originalTemplate.template_name} (Copy)`,
        description: originalTemplate.description,
        event: originalTemplate.event,
        jrotc_program: originalTemplate.jrotc_program,
        scores: originalTemplate.scores,
        is_global: false, // Copies are always school-specific
        school_id: userProfile?.school_id,
        created_by: user.data.user?.id
      };

      const { data, error } = await supabase
        .from('competition_templates')
        .insert(newTemplate)
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => [data, ...prev]);
      toast.success('Template copied successfully');
      return data;
    } catch (error) {
      console.error('Error copying template:', error);
      toast.error('Failed to copy template');
      throw error;
    }
  };

  const toggleMyTemplatesFilter = (value: boolean) => {
    setShowOnlyMyTemplates(value);
    fetchTemplates(value);
  };

  const canEditTemplate = (template: CompetitionTemplate) => {
    if (userProfile?.role === 'admin') return true;
    if (template.is_global) return false;
    return template.school_id === userProfile?.school_id;
  };

  const canCopyTemplate = (template: CompetitionTemplate) => {
    // Can copy if it's not owned by current school or if it's global
    return template.school_id !== userProfile?.school_id || template.is_global;
  };

  const filteredTemplates = templates.filter(template => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const templateName = template.template_name.toLowerCase();
    const eventType = template.event.toLowerCase();
    const jrotcProgram = template.jrotc_program.toLowerCase();
    
    return templateName.includes(query) || 
           eventType.includes(query) || 
           jrotcProgram.includes(query);
  });

  useEffect(() => {
    fetchTemplates(showOnlyMyTemplates);
  }, []);

  return {
    templates: filteredTemplates,
    isLoading,
    showOnlyMyTemplates,
    searchQuery,
    setSearchQuery,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    copyTemplate,
    toggleMyTemplatesFilter,
    canEditTemplate,
    canCopyTemplate,
    refetch: () => fetchTemplates(showOnlyMyTemplates)
  };
};