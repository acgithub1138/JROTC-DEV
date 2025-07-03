import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompetitionTemplate } from '../types';
import { JsonFieldBuilder } from './JsonFieldBuilder';
import type { Database } from '@/integrations/supabase/types';

type DatabaseCompetitionTemplate = Database['public']['Tables']['competition_templates']['Row'];

interface TemplateFormProps {
  template?: CompetitionTemplate | DatabaseCompetitionTemplate | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    template_name: template?.template_name || '',
    event: template?.event || 'Armed Regulation',
    jrotc_program: template?.jrotc_program || 'air_force',
    scores: (typeof template?.scores === 'object' && template?.scores !== null) 
      ? template.scores as Record<string, any>
      : {} as Record<string, any>,
    is_active: template?.is_active ?? true,
  });

  const [useBuilder, setUseBuilder] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const eventOptions = [
    'Armed Inspection',
    'Armed Color Guard', 
    'Armed Exhibition',
    'Armed Dual Exhibition',
    'Armed Regulation',
    'Armed Solo Exhibition',
    'Unarmed Inspection',
    'Unarmed Color Guard',
    'Unarmed Exhibition', 
    'Unarmed Dual Exhibition',
    'Unarmed Regulation'
  ];

  const programOptions = [
    { value: 'air_force', label: 'Air Force' },
    { value: 'army', label: 'Army' },
    { value: 'navy', label: 'Navy' },
    { value: 'marine_corps', label: 'Marine Corps' },
    { value: 'coast_guard', label: 'Coast Guard' },
    { value: 'space_force', label: 'Space Force' }
  ];

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

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="template_name">Template Name *</Label>
        <Input
          id="template_name"
          value={formData.template_name}
          onChange={(e) => updateFormData('template_name', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="jrotc_program">JROTC Program *</Label>
          <Select value={formData.jrotc_program} onValueChange={(value) => updateFormData('jrotc_program', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {programOptions.map((program) => (
                <SelectItem key={program.value} value={program.value}>
                  {program.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="event">Event Type *</Label>
          <Select value={formData.event} onValueChange={(value) => updateFormData('event', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {eventOptions.map((event) => (
                <SelectItem key={event} value={event}>
                  {event}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Score Sheet Structure *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setUseBuilder(!useBuilder)}
          >
            {useBuilder ? 'Manual JSON' : 'Field Builder'}
          </Button>
        </div>
        
        {useBuilder ? (
          <JsonFieldBuilder
            value={formData.scores}
            onChange={(scores) => updateFormData('scores', scores)}
          />
        ) : (
          <div className="space-y-2">
            <Textarea
              value={JSON.stringify(formData.scores, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateFormData('scores', parsed);
                } catch {
                  // Invalid JSON, don't update
                }
              }}
              rows={10}
              className="font-mono text-sm"
              placeholder={`{
  "criteria": [
    {
      "name": "Uniform Inspection",
      "type": "text",
      "maxLength": 100,
      "penalty": false
    }
  ]
}`}
            />
            <p className="text-sm text-muted-foreground">
              Define the JSON structure for this score sheet template.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (template ? 'Update' : 'Create')}
        </Button>
      </div>
    </form>
  );
};