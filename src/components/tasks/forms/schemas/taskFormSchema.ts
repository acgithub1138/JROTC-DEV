
import { z } from 'zod';
import { getTaskStatusValues, getTaskPriorityValues } from '@/config/taskOptions';

export const taskSchema = z.object({
  title: z.string().min(1, 'Task name is required').max(150, 'Task name must be 150 characters or less'),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
  priority: z.enum(getTaskPriorityValues() as [string, ...string[]]),
  status: z.enum(getTaskStatusValues() as [string, ...string[]]),
  due_date: z.date().optional(),
});

export type TaskFormData = z.infer<typeof taskSchema>;
