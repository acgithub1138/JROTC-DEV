import { z } from 'zod';

// Dynamic schema for incident validation
export const createIncidentSchema = (
  statusOptions: string[], 
  priorityOptions: string[], 
  categoryOptions: string[],
  canAssignIncidents: boolean = false
) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  
  return z.object({
    title: z.string().min(1, 'Incident title is required').max(150, 'Incident title must be 150 characters or less'),
    description: z.string().min(1, 'Incident description is required'),
    status: z.enum(statusOptions as [string, ...string[]]),
    priority: z.enum(priorityOptions as [string, ...string[]]),
    category: z.enum(categoryOptions as [string, ...string[]]),
    due_date: z.date()
      .optional()
      .refine((date) => {
        if (!date) return true; // Optional field, so undefined/null is valid
        return date >= today;
      }, {
        message: 'Due date must be today or later'
      }),
  });
};

// Type for incident form data
export type IncidentFormData = {
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  due_date?: Date;
};