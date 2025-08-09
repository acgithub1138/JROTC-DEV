import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { COMPETITION_EVENT_TYPES, JROTC_PROGRAMS } from '../utils/constants';
import type { CompetitionTemplate } from '../types';

const templateSchema = z.object({
  template_name: z.string().min(1, 'Template name is required'),
  event: z.string().min(1, 'Event type is required'),
  jrotc_program: z.string().min(1, 'JROTC program is required'),
  description: z.string().optional(),
  is_active: z.boolean(),
  scores: z.record(z.any()).optional()
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface TemplateFormProps {
  template?: CompetitionTemplate | null;
  onSubmit: (data: TemplateFormData) => Promise<void>;
  onCancel: () => void;
  onFormChange: (hasChanges: boolean) => void;
  isSubmitting: boolean;
}

export const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  onSubmit,
  onCancel,
  onFormChange,
  isSubmitting
}) => {
  const [scoreFields, setScoreFields] = useState<Array<{ key: string; value: any }>>([]);

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      template_name: template?.template_name || '',
      event: template?.event || '',
      jrotc_program: template?.jrotc_program || '',
      description: template?.description || '',
      is_active: template?.is_active ?? true,
      scores: template?.scores || {}
    }
  });

  const { formState, watch } = form;

  // Watch for form changes
  useEffect(() => {
    const subscription = watch(() => {
      onFormChange(formState.isDirty);
    });
    return () => subscription.unsubscribe();
  }, [watch, formState.isDirty, onFormChange]);

  // Initialize score fields from template
  useEffect(() => {
    if (template?.scores) {
      const fields = Object.entries(template.scores).map(([key, value]) => ({
        key,
        value
      }));
      setScoreFields(fields);
    }
  }, [template]);

  const addScoreField = () => {
    setScoreFields([...scoreFields, { key: '', value: 0 }]);
  };

  const removeScoreField = (index: number) => {
    const newFields = scoreFields.filter((_, i) => i !== index);
    setScoreFields(newFields);
    updateScores(newFields);
  };

  const updateScoreField = (index: number, field: 'key' | 'value', value: any) => {
    const newFields = [...scoreFields];
    newFields[index] = { ...newFields[index], [field]: value };
    setScoreFields(newFields);
    updateScores(newFields);
  };

  const updateScores = (fields: Array<{ key: string; value: any }>) => {
    const scores = fields.reduce((acc, field) => {
      if (field.key.trim()) {
        acc[field.key.trim()] = field.value;
      }
      return acc;
    }, {} as Record<string, any>);
    form.setValue('scores', scores, { shouldDirty: true });
  };

  const handleSubmit = async (data: TemplateFormData) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="template_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter template name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="event"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COMPETITION_EVENT_TYPES.map((event) => (
                      <SelectItem key={event} value={event}>
                        {event}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="jrotc_program"
            render={({ field }) => (
              <FormItem>
                <FormLabel>JROTC Program</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select JROTC program" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {JROTC_PROGRAMS.map((program) => (
                      <SelectItem key={program.value} value={program.value}>
                        {program.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="!mt-0">Active Template</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Enter template description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Score Sheet Fields</Label>
            <Button type="button" variant="outline" onClick={addScoreField}>
              Add Field
            </Button>
          </div>
          
          {scoreFields.map((field, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                placeholder="Field name"
                value={field.key}
                onChange={(e) => updateScoreField(index, 'key', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Max points"
                value={field.value}
                onChange={(e) => updateScoreField(index, 'value', parseFloat(e.target.value) || 0)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeScoreField(index)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </form>
    </Form>
  );
};