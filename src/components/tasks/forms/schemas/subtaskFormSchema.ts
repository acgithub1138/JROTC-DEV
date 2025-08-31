import { z } from 'zod';

// Dynamic schema for subtask validation
export const createSubtaskSchema = (statusOptions: string[], priorityOptions: string[]) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow
  
  return z.object({
    title: z.string().min(1, 'Subtask title is required').max(150, 'Subtask title must be 150 characters or less'),
    description: z.string().min(1, 'Subtask details are required'),
    status: z.enum(statusOptions as [string, ...string[]]),
    priority: z.enum(priorityOptions as [string, ...string[]]),
    assigned_to: z.string().min(1, 'Assigned to is required'),
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

// Type for subtask form data
export type SubtaskFormData = {
  title: string;
  description: string;
  status: string;
  priority: string;
  assigned_to: string;
  due_date?: Date;
};