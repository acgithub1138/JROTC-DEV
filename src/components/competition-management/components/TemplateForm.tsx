import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompetitionTemplate } from '../types';
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
    scores: template?.scores || {},
    is_active: template?.is_active ?? true,
  });

  const [scoresJson, setScoresJson] = useState(
    JSON.stringify(template?.scores || {}, null, 2)
  );

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
      
      // Parse JSON scores
      let parsedScores = {};
      try {
        parsedScores = JSON.parse(scoresJson);
      } catch (error) {
        throw new Error('Invalid JSON format in scores field');
      }

      await onSubmit({
        ...formData,
        scores: parsedScores
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="template_name">Template Name *</Label>
          <Input
            id="template_name"
            value={formData.template_name}
            onChange={(e) => updateFormData('template_name', e.target.value)}
            required
          />
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="scores">Score Sheet Structure (JSON) *</Label>
        <Textarea
          id="scores"
          value={scoresJson}
          onChange={(e) => setScoresJson(e.target.value)}
          rows={10}
          className="font-mono text-sm"
          placeholder={`{
  "criteria": [
    {
      "name": "Uniform Inspection",
      "maxPoints": 100,
      "subCriteria": [
        {"name": "Overall Appearance", "maxPoints": 25},
        {"name": "Grooming Standards", "maxPoints": 25},
        {"name": "Uniform Completeness", "maxPoints": 25},
        {"name": "Uniform Condition", "maxPoints": 25}
      ]
    }
  ]
}`}
          required
        />
        <p className="text-sm text-muted-foreground">
          Define the JSON structure for this score sheet template. This will be used to generate dynamic scoring forms.
        </p>
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