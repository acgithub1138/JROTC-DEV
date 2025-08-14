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
import { JsonFieldBuilder } from './json-field-builder/JsonFieldBuilder';
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
  const watchedValues = watch();

  // Watch for form changes
  useEffect(() => {
    const subscription = watch(() => {
      onFormChange(formState.isDirty);
    });
    return () => subscription.unsubscribe();
  }, [watch, formState.isDirty, onFormChange]);

  const handleScoresChange = (newScores: Record<string, any>) => {
    form.setValue('scores', newScores, { shouldDirty: true });
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

        {/* Score Sheet Builder */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Score Sheet Builder</h3>
          <JsonFieldBuilder 
            value={watchedValues.scores || {}}
            onChange={handleScoresChange}
          />
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