
import { z } from 'zod';
import { getTaskStatusValues, getTaskPriorityValues } from '@/config/taskOptions';

// Create the enum schema with proper literal types
const taskStatusSchema = z.enum(getTaskStatusValues() as [string, ...string[]]);
const taskPrioritySchema = z.enum(getTaskPriorityValues() as [string, ...string[]]);

export const taskSchema = z.object({
  title: z.string().min(1, 'Task name is required').max(150, 'Task name must be 150 characters or less'),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
  priority: taskPrioritySchema,
  status: taskStatusSchema,
  due_date: z.date().optional(),
});

export type TaskFormData = z.infer<typeof taskSchema>;
