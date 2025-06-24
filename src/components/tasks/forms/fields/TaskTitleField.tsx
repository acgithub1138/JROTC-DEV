
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UseFormReturn } from 'react-hook-form';
import { TaskFormData } from '../schemas/taskFormSchema';

interface TaskTitleFieldProps {
  form: UseFormReturn<TaskFormData>;
}

export const TaskTitleField: React.FC<TaskTitleFieldProps> = ({ form }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="title">Task Name *</Label>
      <Input
        id="title"
        {...form.register('title')}
        placeholder="Enter task name (max 150 characters)"
        maxLength={150}
      />
      {form.formState.errors.title && (
        <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
      )}
    </div>
  );
};
