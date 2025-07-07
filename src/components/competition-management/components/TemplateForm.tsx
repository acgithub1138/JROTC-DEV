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
  const { templates } = useCompetitionTemplates();
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    template_name: template?.template_name || '',
    description: (template as any)?.description || '',
    event: template?.event || 'Armed Regulation',
    jrotc_program: template?.jrotc_program || 'air_force',
    scores: typeof template?.scores === 'object' && template?.scores !== null ? template.scores as Record<string, any> : {} as Record<string, any>,
    is_active: template?.is_active ?? true,
    is_global: (template as any)?.is_global ?? false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialFormData] = useState(formData);
  
  const isAdmin = userProfile?.role === 'admin';
  const eventOptions = ['Armed Inspection', 'Armed Color Guard', 'Armed Exhibition', 'Armed Dual Exhibition', 'Armed Regulation', 'Armed Solo Exhibition', 'Unarmed Inspection', 'Unarmed Color Guard', 'Unarmed Exhibition', 'Unarmed Dual Exhibition', 'Unarmed Regulation'];
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
    try {
      setIsSubmitting(true);
      await onSubmit({
        ...formData,
        scores: formData.scores
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  // Auto-generate template name based on program and event
  const generateTemplateName = (program: string, event: string): string => {
    const programLabel = programOptions.find(p => p.value === program)?.label || program;
    const baseName = `${programLabel} - ${event}`;
    
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
  }, [formData.jrotc_program, formData.event, templates, template]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {eventOptions.map(event => <SelectItem key={event} value={event}>
                  {event}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="template_name">Template Name *</Label>
        <Input id="template_name" value={formData.template_name} onChange={e => updateFormData('template_name', e.target.value)} required />
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          value={formData.description} 
          onChange={e => updateFormData('description', e.target.value)} 
          placeholder="Describe what this template is for..."
          rows={3}
        />
      </div>

      {isAdmin && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_global"
            checked={formData.is_global}
            onCheckedChange={(checked) => updateFormData('is_global', checked)}
          />
          <Label htmlFor="is_global" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Global Template
          </Label>
          <p className="text-xs text-muted-foreground">
            Global templates are visible to all schools and can only be edited by admins
          </p>
        </div>
      )}

      <div className="space-y-2">        
        {useBuilder ? <JsonFieldBuilder value={formData.scores} onChange={scores => updateFormData('scores', scores)} /> : <div className="space-y-1">
            <Textarea value={JSON.stringify(formData.scores, null, 2)} onChange={e => {
          try {
            const parsed = JSON.parse(e.target.value);
            updateFormData('scores', parsed);
          } catch {
            // Invalid JSON, don't update
          }
        }} rows={10} className="font-mono text-sm" placeholder={`{
  "criteria": [
    {
      "name": "Uniform Inspection",
      "type": "text",
      "maxLength": 100,
      "penalty": false
    }
  ]
}`} />
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