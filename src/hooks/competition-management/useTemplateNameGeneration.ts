import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompetitionTemplates } from '../../components/competition-management/hooks/useCompetitionTemplates';
import { useCompetitionEventTypes } from '../../components/competition-management/hooks/useCompetitionEventTypes';
import type { CompetitionTemplate } from '../../components/competition-management/types';
import type { Database } from '@/integrations/supabase/types';

type DatabaseCompetitionTemplate = Database['public']['Tables']['competition_templates']['Row'];

interface UseTemplateNameGenerationProps {
  template?: CompetitionTemplate | DatabaseCompetitionTemplate | null;
}

export const useTemplateNameGeneration = ({ template }: UseTemplateNameGenerationProps) => {
  const { templates } = useCompetitionTemplates();
  const { eventTypes } = useCompetitionEventTypes();
  const { userProfile } = useAuth();

  const programOptions = useMemo(() => [
    { value: 'air_force', label: 'Air Force' },
    { value: 'army', label: 'Army' },
    { value: 'navy', label: 'Navy' },
    { value: 'marine_corps', label: 'Marine Corps' },
    { value: 'coast_guard', label: 'Coast Guard' },
    { value: 'space_force', label: 'Space Force' }
  ], []);

  const generateTemplateName = useMemo(() => (program: string, eventId: string): string => {
    const programLabel = programOptions.find(p => p.value === program)?.label || program;
    const eventType = eventTypes.find(et => et.id === eventId);
    const eventName = eventType ? eventType.name : eventId;
    const schoolInitials = userProfile?.schools?.initials || '';
    const baseName = `${programLabel} - ${eventName}${schoolInitials ? ` (${schoolInitials})` : ''}`;

    // Check if this exact name exists
    const existingTemplates = templates.filter(t => 
      t.template_name.startsWith(baseName) && 
      (!template || t.id !== template.id) // Exclude current template when editing
    );
    
    if (existingTemplates.length === 0) {
      return baseName;
    }

    // Find the highest number suffix
    let maxNumber = 0;
    existingTemplates.forEach(t => {
      const match = t.template_name.match(new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?: (\\d+))?$`));
      if (match) {
        const num = match[1] ? parseInt(match[1]) : 1;
        maxNumber = Math.max(maxNumber, num);
      }
    });
    
    return `${baseName} ${maxNumber + 1}`;
  }, [programOptions, eventTypes, userProfile?.schools?.initials, templates, template]);

  return {
    generateTemplateName,
    programOptions
  };
};