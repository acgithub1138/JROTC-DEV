
import { z } from 'zod';

// Dynamic schema that will be populated with database values
export const createTaskSchema = (statusOptions: string[], priorityOptions: string[], canAssignTasks: boolean = true) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow
  
  return z.object({
    title: z.string().min(1, 'Task name is required').max(150, 'Task name must be 150 characters or less'),
    description: z.string().min(1, 'Task details are required'),
    assigned_to: z.string().min(1, 'Assigned to is required'),
    priority: z.enum(priorityOptions as [string, ...string[]]),
    status: z.enum(statusOptions as [string, ...string[]]),
    due_date: z.date()
      .optional()
      .refine((date) => {
        if (!date) return true; // Optional field, so undefined/null is valid
        return date >= tomorrow;
      }, {
        message: 'Due date must be tomorrow or later'
      }),
  });
};

// Type will be inferred dynamically
export type TaskFormData = {
  title: string;
  description: string;
  assigned_to: string;
  priority: string;
  status: string;
  due_date?: Date;
};
