import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompetitionEventTypes } from '../../components/competition-management/hooks/useCompetitionEventTypes';
import { useTemplateNameGeneration } from './useTemplateNameGeneration';
import type { CompetitionTemplate } from '../../components/competition-management/types';
import type { Database } from '@/integrations/supabase/types';

type DatabaseCompetitionTemplate = Database['public']['Tables']['competition_templates']['Row'];

interface UseTemplateFormProps {
  template?: CompetitionTemplate | DatabaseCompetitionTemplate | null;
  onFormChange?: (hasChanges: boolean) => void;
  useBuilder: boolean;
}

export const useTemplateForm = ({ template, onFormChange, useBuilder }: UseTemplateFormProps) => {
  const { eventTypes } = useCompetitionEventTypes();
  const { userProfile } = useAuth();
  const { generateTemplateName } = useTemplateNameGeneration({ template });

  // Helper function to get event UUID from name or return UUID if already valid
  const getEventUuid = (eventValue: string | undefined | null): string => {
    if (!eventValue) return '';

    // Check if it's already a UUID (36 characters with dashes)
    if (eventValue.length === 36 && eventValue.includes('-')) {
      return eventValue;
    }

    // Otherwise, find the event type by name and return its UUID
    const eventType = eventTypes.find(et => et.name === eventValue);
    return eventType ? eventType.id : '';
  };

  const [formData, setFormData] = useState({
    template_name: template?.template_name || '',
    description: (template as any)?.description || '',
    event: getEventUuid(template?.event) || '',
    jrotc_program: template?.jrotc_program || 'air_force',
    scores: typeof template?.scores === 'object' && template?.scores !== null 
      ? template.scores as Record<string, any> 
      : {} as Record<string, any>,
    is_active: template?.is_active ?? true,
    is_global: (template as any)?.is_global ?? false,
    judges: Number((template as any)?.judges) || 4
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialFormData] = useState(formData);
  const [jsonText, setJsonText] = useState(JSON.stringify(formData.scores, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const isAdmin = userProfile?.role === 'admin';

  // Auto-generate template name when program or event changes (but not when editing existing template)
  useEffect(() => {
    if (!template && formData.jrotc_program && formData.event) {
      const newName = generateTemplateName(formData.jrotc_program, formData.event);
      setFormData(prev => ({
        ...prev,
        template_name: newName
      }));
    }
  }, [formData.jrotc_program, formData.event, generateTemplateName, template]);

  // Update form data when eventTypes are loaded and we have a template with a name-based event
  useEffect(() => {
    if (template && eventTypes.length > 0 && template.event) {
      const correctEventId = getEventUuid(template.event);
      if (correctEventId && correctEventId !== formData.event) {
        setFormData(prev => ({
          ...prev,
          event: correctEventId
        }));
      }
    }
  }, [eventTypes, template]);

  // Update jsonText when scores change from field builder
  useEffect(() => {
    if (useBuilder) {
      setJsonText(JSON.stringify(formData.scores, null, 2));
    }
  }, [formData.scores, useBuilder]);

  // Check for changes compared to initial data
  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    onFormChange?.(hasChanges);
  }, [formData, initialFormData, onFormChange]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleJsonTextChange = (value: string) => {
    setJsonText(value);
    setJsonError(null);

    // Try to parse JSON and update form data if valid
    try {
      const parsed = JSON.parse(value);
      setFormData(prev => ({
        ...prev,
        scores: parsed
      }));
    } catch {
      // Invalid JSON, keep the text but don't update scores yet
    }
  };

  const validateAndPrepareSubmission = () => {
    // For manual JSON mode, validate and parse JSON before submitting
    if (!useBuilder) {
      try {
        const parsedScores = JSON.parse(jsonText);
        setFormData(prev => ({
          ...prev,
          scores: parsedScores
        }));
        setJsonError(null);
        return {
          ...formData,
          scores: parsedScores
        };
      } catch (error) {
        setJsonError('Invalid JSON format. Please fix the JSON before saving.');
        return null;
      }
    }

    return {
      ...formData,
      scores: useBuilder ? formData.scores : JSON.parse(jsonText)
    };
  };

  return {
    formData,
    updateFormData,
    isSubmitting,
    setIsSubmitting,
    jsonText,
    jsonError,
    isAdmin,
    handleJsonTextChange,
    validateAndPrepareSubmission
  };
};
