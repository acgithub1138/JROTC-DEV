import { NewCadet } from '../types';

export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(header => header.trim().replace(/['"]/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(value => value.trim().replace(/['"]/g, ''));
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }

  return rows;
}

export function validateCadetData(cadet: NewCadet): string[] {
  const errors: string[] = [];

  // Required field validations
  if (!cadet.first_name.trim()) {
    errors.push('First name is required');
  }

  if (!cadet.last_name.trim()) {
    errors.push('Last name is required');
  }

  if (!cadet.email.trim()) {
    errors.push('Email is required');
  } else {
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cadet.email)) {
      errors.push('Invalid email format');
    }
  }

  // Role validation
  if (!cadet.role_id || cadet.role_id.trim() === '') {
    errors.push('Role is required');
  }

  return errors;
}

export function validateCSVHeaders(headers: string[]): string[] {
  const requiredHeaders = ['First Name', 'Last Name', 'Email', 'Role'];
  const optionalHeaders = ['Grade', 'Rank', 'Flight', 'Cadet Year', 'Year', 'Freshman Year'];
  const validHeaders = [...requiredHeaders, ...optionalHeaders];
  
  const errors: string[] = [];
  
  // Check for required headers
  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      errors.push(`Missing required column: ${required}`);
    }
  }
  
  // Check for invalid headers
  for (const header of headers) {
    if (!validHeaders.includes(header)) {
      errors.push(`Unknown column: ${header}`);
    }
  }
  
  return errors;
}