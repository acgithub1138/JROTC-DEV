
import { z } from 'zod';

export const taskSchema = z.object({
  title: z.string().min(1, 'Task name is required').max(150, 'Task name must be 150 characters or less'),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'critical']),
  status: z.enum(['not_started', 'working_on_it', 'stuck', 'done', 'pending', 'in_progress', 'completed', 'overdue', 'canceled']),
  due_date: z.date().optional(),
});

export type TaskFormData = z.infer<typeof taskSchema>;
