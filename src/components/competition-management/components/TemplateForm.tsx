import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompetitionTemplate } from '../types';
import { JsonFieldBuilder } from './JsonFieldBuilder';
import { useCompetitionTemplates } from '../hooks/useCompetitionTemplates';
import { useAuth } from '@/contexts/AuthContext';
import { useCompetitionEventTypes } from '../hooks/useCompetitionEventTypes';
import type { Database } from '@/integrations/supabase/types';
type DatabaseCompetitionTemplate = Database['public']['Tables']['competition_templates']['Row'];
interface TemplateFormProps {
  template?: CompetitionTemplate | DatabaseCompetitionTemplate | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  onFormChange?: (hasChanges: boolean) => void;
  useBuilder: boolean;
}
export const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  onSubmit,
  onCancel,
  onFormChange,
  useBuilder
}) => {
  const {
    templates
  } = useCompetitionTemplates();
  const {
    eventTypes
  } = useCompetitionEventTypes();
  const {
    userProfile
  } = useAuth();

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
    scores: typeof template?.scores === 'object' && template?.scores !== null ? template.scores as Record<string, any> : {} as Record<string, any>,
    is_active: template?.is_active ?? true,
    is_global: (template as any)?.is_global ?? false,
    judges: Number((template as any)?.judges) || 4
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialFormData] = useState(formData);
  const [jsonText, setJsonText] = useState(JSON.stringify(formData.scores, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const isAdmin = userProfile?.role === 'admin';
  const programOptions = [{
    value: 'air_force',
    label: 'Air Force'
  }, {
    value: 'army',
    label: 'Army'
  }, {
    value: 'navy',
    label: 'Navy'
  }, {
    value: 'marine_corps',
    label: 'Marine Corps'
  }, {
    value: 'coast_guard',
    label: 'Coast Guard'
  }, {
    value: 'space_force',
    label: 'Space Force'
  }];
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // For manual JSON mode, validate and parse JSON before submitting
    if (!useBuilder) {
      try {
        const parsedScores = JSON.parse(jsonText);
        setFormData(prev => ({
          ...prev,
          scores: parsedScores
        }));
        setJsonError(null);
      } catch (error) {
        setJsonError('Invalid JSON format. Please fix the JSON before saving.');
        return;
      }
    }
    try {
      setIsSubmitting(true);
      await onSubmit({
        ...formData,
        scores: useBuilder ? formData.scores : JSON.parse(jsonText)
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  // Auto-generate template name based on program and event
  const generateTemplateName = (program: string, eventId: string): string => {
    const programLabel = programOptions.find(p => p.value === program)?.label || program;
    const eventType = eventTypes.find(et => et.id === eventId);
    const eventName = eventType ? eventType.name : eventId;
    const schoolInitials = userProfile?.schools?.initials || '';
    const baseName = `${programLabel} - ${eventName}${schoolInitials ? ` (${schoolInitials})` : ''}`;

    // Check if this exact name exists
    const existingTemplates = templates.filter(t => t.template_name.startsWith(baseName) && (!template || t.id !== template.id) // Exclude current template when editing
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
  };
  useEffect(() => {
    // Auto-generate template name when program or event changes (but not when editing existing template)
    if (!template && formData.jrotc_program && formData.event) {
      const newName = generateTemplateName(formData.jrotc_program, formData.event);
      setFormData(prev => ({
        ...prev,
        template_name: newName
      }));
    }
  }, [formData.jrotc_program, formData.event, templates, template, eventTypes]);

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
  return <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="jrotc_program">JROTC Program *</Label>
          <Select value={formData.jrotc_program} onValueChange={value => updateFormData('jrotc_program', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {programOptions.map(program => <SelectItem key={program.value} value={program.value}>
                  {program.label}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="event">Event Type *</Label>
          <Select value={formData.event} onValueChange={value => updateFormData('event', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select event type..." />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map(eventType => <SelectItem key={eventType.id} value={eventType.id}>
                  {eventType.name}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="template_name">Template Name *</Label>
          <Input id="template_name" value={formData.template_name} onChange={e => updateFormData('template_name', e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="judges">Number of event Judges</Label>
          <Select value={String(formData.judges)} onValueChange={value => updateFormData('judges', parseInt(value, 10))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({
              length: 10
            }, (_, i) => i + 1).map(n => <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={formData.description} onChange={e => updateFormData('description', e.target.value)} placeholder="Describe what this template is for..." rows={3} />
      </div>

      {isAdmin && <div className="flex items-center space-x-2">
          <Checkbox id="is_global" checked={formData.is_global} onCheckedChange={checked => updateFormData('is_global', checked)} />
          <Label htmlFor="is_global" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Global Template
          </Label>
          <p className="text-xs text-muted-foreground">
            Global templates are visible to all schools and can only be edited by admins
          </p>
        </div>}

      <div className="space-y-2">        
        {useBuilder ? <JsonFieldBuilder value={formData.scores} onChange={scores => updateFormData('scores', scores)} /> : <div className="space-y-1">
            <Textarea value={jsonText} onChange={e => handleJsonTextChange(e.target.value)} rows={10} className="font-mono text-sm" placeholder={`{
  "criteria": [
    {
      "name": "Uniform Inspection",
      "type": "text",
      "maxLength": 100,
      "penalty": false
    }
  ]
}`} />
            {jsonError && <p className="text-sm text-destructive">{jsonError}</p>}
            <p className="text-sm text-muted-foreground">
              Define the JSON structure for this score sheet template.
            </p>
          </div>}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : template ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>;
};