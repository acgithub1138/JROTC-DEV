import { z } from 'zod';

export const createCadetSchema = () => {
  return z.object({
    first_name: z.string().min(1, 'First name is required').max(50, 'First name must be 50 characters or less'),
    last_name: z.string().min(1, 'Last name is required').max(50, 'Last name must be 50 characters or less'),
    email: z.string().email('Valid email is required'),
    grade: z.string().min(1, 'Grade is required'),
    rank: z.string().min(1, 'Rank is required'),
    flight: z.string().min(1, 'Flight is required'),
    cadet_year: z.string().min(1, 'Cadet year is required'),
    role_id: z.string().min(1, 'Role is required'),
    start_year: z.string().min(1, 'Freshman year is required')
  });
};

export type CadetFormData = {
  first_name: string;
  last_name: string;
  email: string;
  grade: string;
  rank: string;
  flight: string;
  cadet_year: string;
  role_id: string;
  start_year: string;
};