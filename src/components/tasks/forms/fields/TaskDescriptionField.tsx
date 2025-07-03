
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';
import { TaskFormData } from '../schemas/taskFormSchema';

interface TaskDescriptionFieldProps {
  form: UseFormReturn<TaskFormData>;
}

export const TaskDescriptionField: React.FC<TaskDescriptionFieldProps> = ({ form }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="description">Task Details *</Label>
      <Textarea
        id="description"
        {...form.register('description')}
        placeholder="Enter detailed description of the task"
        rows={4}
      />
      {form.formState.errors.description && (
        <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
      )}
    </div>
  );
};
