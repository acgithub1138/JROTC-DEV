import { z } from 'zod';

export const createCadetSchema = () => {
  return z.object({
    first_name: z.string().min(1, 'First name is required').max(50, 'First name must be 50 characters or less'),
    last_name: z.string().min(1, 'Last name is required').max(50, 'Last name must be 50 characters or less'),
    email: z.string().email('Valid email is required'),
    grade: z.string().optional(),
    rank: z.string().optional(),
    flight: z.string().optional(),
    cadet_year: z.string().optional(),
    role_id: z.string().optional(),
    start_year: z.string().optional()
  });
};

export type CadetFormData = {
  first_name: string;
  last_name: string;
  email: string;
  grade?: string;
  rank?: string;
  flight?: string;
  cadet_year?: string;
  role_id?: string;
  start_year?: string;
};