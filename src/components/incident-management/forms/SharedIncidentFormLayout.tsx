import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IncidentInfoFields } from './fields/IncidentInfoFields';
import { IncidentPriorityStatusDueDateFields } from './fields/IncidentPriorityStatusDueDateFields';
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
        {/* Two-column layout for incident info and priority/status/due date */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Incident Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <IncidentInfoFields
                form={form}
                canAssignIncidents={canAssignIncidents}
                categoryOptions={categoryOptions}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Priority & Due Date</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <IncidentPriorityStatusDueDateFields
                form={form}
                mode={mode}
                priorityOptions={priorityOptions}
              />
            </CardContent>
          </Card>
        </div>

        {/* Single-column layout for title, description, and attachments */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Title & Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {titleField}
              {descriptionField}
            </CardContent>
          </Card>

          {attachmentSection && (
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                {attachmentSection}
              </CardContent>
            </Card>
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