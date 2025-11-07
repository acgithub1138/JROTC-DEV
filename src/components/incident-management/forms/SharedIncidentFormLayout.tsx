import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { IncidentInfoLeftFields } from './fields/IncidentInfoLeftFields';
import { IncidentInfoRightFields } from './fields/IncidentInfoRightFields';
import type { Incident } from '@/hooks/incidents/types';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  
  return (
    <div className="bg-background p-6 rounded-lg border">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Form Actions - Mobile Only (Top) */}
          {isMobile && (
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={onCancel} className="w-full">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
              </Button>
            </div>
          )}

          {/* Top section - Two columns */}
          <div className="grid gap-6 lg:grid-cols-2 p-6 border rounded-lg bg-card">
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
          <div className="space-y-6 p-6 border rounded-lg bg-card">
            <div className="space-y-4">
              {titleField}
              {descriptionField}
            </div>

            {attachmentSection && (
              <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-4`}>
                <label className={`${isMobile ? '' : 'w-24 text-right'} flex-shrink-0 text-sm font-medium`}>
                  Attachments
                </label>
                <div className="flex-1">
                  {attachmentSection}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions - Desktop Only (Bottom) */}
          {!isMobile && (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : submitButtonText}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};