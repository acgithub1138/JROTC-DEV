import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompetitionEventTypes } from '../hooks/useCompetitionEventTypes';
import { useTemplateNameGeneration } from '../../../hooks/competition-management/useTemplateNameGeneration';

interface TemplateFormFieldsProps {
  formData: {
    template_name: string;
    description: string;
    event: string;
    jrotc_program: string;
    is_global: boolean;
    judges: number;
  };
  updateFormData: (field: string, value: any) => void;
  isAdmin: boolean;
  template?: any;
}

export const TemplateFormFields: React.FC<TemplateFormFieldsProps> = ({
  formData,
  updateFormData,
  isAdmin,
  template
}) => {
  const { eventTypes } = useCompetitionEventTypes();
  const { programOptions } = useTemplateNameGeneration({ template });

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="jrotc_program">JROTC Program *</Label>
          <Select value={formData.jrotc_program} onValueChange={value => updateFormData('jrotc_program', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {programOptions.map(program => (
                <SelectItem key={program.value} value={program.value}>
                  {program.label}
                </SelectItem>
              ))}
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
              {eventTypes.map(eventType => (
                <SelectItem key={eventType.id} value={eventType.id}>
                  {eventType.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="template_name">Template Name *</Label>
          <Input 
            id="template_name" 
            value={formData.template_name} 
            onChange={e => updateFormData('template_name', e.target.value)} 
            required 
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="judges">Number of event Judges</Label>
          <Select value={String(formData.judges)} onValueChange={value => updateFormData('judges', parseInt(value, 10))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
            onCheckedChange={checked => updateFormData('is_global', checked)} 
          />
          <Label htmlFor="is_global" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Global Template
          </Label>
          <p className="text-xs text-muted-foreground">
            Global templates are visible to all schools and can only be edited by admins
          </p>
        </div>
      )}
    </>
  );
};