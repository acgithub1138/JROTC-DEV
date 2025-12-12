import React from 'react';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { TaskInfoFields } from './fields/TaskInfoFields';
import { TaskPriorityStatusDueDateFields } from './fields/TaskPriorityStatusDueDateFields';
import { TaskStatusOption, TaskPriorityOption } from '@/hooks/tasks/types';
import { FormWrapper, FormSection, TwoColumnGrid, FormButtonRow, FormSpacer } from '@/components/ui/layout';

interface SharedTaskFormLayoutProps {
  form: any;
  onSubmit: (e: React.FormEvent) => void;
  mode: 'create' | 'edit';
  taskNumber?: string;
  createdAt?: string;
  createdBy?: string;
  canAssignTasks: boolean;
  canEditThisTask: boolean;
  isEditingAssignedTask: boolean;
  statusOptions: TaskStatusOption[];
  priorityOptions: TaskPriorityOption[];
  titleField: React.ReactNode;
  descriptionField: React.ReactNode;
  attachmentSection?: React.ReactNode;
  onCancel: () => void;
  submitButtonText: string;
  isSubmitting: boolean;
  isSubmitDisabled?: boolean;
  hideActionButtons?: boolean;
}

export const SharedTaskFormLayout: React.FC<SharedTaskFormLayoutProps> = ({
  form,
  onSubmit,
  mode,
  taskNumber,
  createdAt,
  createdBy,
  canAssignTasks,
  canEditThisTask,
  isEditingAssignedTask,
  statusOptions,
  priorityOptions,
  titleField,
  descriptionField,
  attachmentSection,
  onCancel,
  submitButtonText,
  isSubmitting,
  isSubmitDisabled = false,
  hideActionButtons = false,
}) => {
  return (
    <FormWrapper>
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6" id="task-form">
          {/* Top Section - Two Columns */}
          <FormSection>
            <TwoColumnGrid>
              <TaskInfoFields
                mode={mode}
                taskNumber={taskNumber}
                createdAt={createdAt}
                createdBy={createdBy}
              />
              
              <TaskPriorityStatusDueDateFields
                form={form}
                canAssignTasks={canAssignTasks}
                canEditThisTask={canEditThisTask}
                isEditingAssignedTask={isEditingAssignedTask}
                statusOptions={statusOptions}
                priorityOptions={priorityOptions}
              />
            </TwoColumnGrid>
          </FormSection>

          {/* Bottom Section - Single Column */}
          <FormSection>
            <FormSpacer size="lg">
              {titleField}
              {descriptionField}
              {attachmentSection}
            </FormSpacer>
          </FormSection>

          {!hideActionButtons && (
            <FormButtonRow>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isSubmitDisabled}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? 'Saving...' : submitButtonText}
              </Button>
            </FormButtonRow>
          )}
        </form>
      </Form>
    </FormWrapper>
  );
};