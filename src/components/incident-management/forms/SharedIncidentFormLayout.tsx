import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { IncidentInfoLeftFields } from './fields/IncidentInfoLeftFields';
import { IncidentInfoRightFields } from './fields/IncidentInfoRightFields';
import type { Incident } from '@/hooks/incidents/types';

interface SharedIncidentFormLayoutProps {
  form: UseFormReturn<any>;
  onSubmit: (data: any) => void;
  mode: 'create' | 'edit';
  incident?: Incident;
  canAssignIncidents: boolean;
  priorityOptions: Array<{ value: string; label: string; }>;
  categoryOptions: Array<{ value: string; label: string; }>;
  titleField: React.ReactNode;
  descriptionField: React.ReactNode;
  attachmentSection?: React.ReactNode;
  onCancel: () => void;
  submitButtonText: string;
  isSubmitting: boolean;
}

export const SharedIncidentFormLayout: React.FC<SharedIncidentFormLayoutProps> = ({
  form,
  onSubmit,
  mode,
  incident,
  canAssignIncidents,
  priorityOptions,
  categoryOptions,
  titleField,
  descriptionField,
  attachmentSection,
  onCancel,
  submitButtonText,
  isSubmitting
}) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Top section - Two columns */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-4">
            <IncidentInfoLeftFields
              form={form}
              mode={mode}
              incident={incident}
              categoryOptions={categoryOptions}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <IncidentInfoRightFields
              form={form}
              mode={mode}
              canAssignIncidents={canAssignIncidents}
              priorityOptions={priorityOptions}
            />
          </div>
        </div>

        {/* Bottom section - Single column */}
        <div className="space-y-6">
          <div className="space-y-4">
            {titleField}
            {descriptionField}
          </div>

          {attachmentSection && (
            <div className="space-y-2">
              <label className="w-32 text-right flex-shrink-0 text-sm font-medium inline-block">
                Attachments
              </label>
              <div className="ml-36">
                {attachmentSection}
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );
};