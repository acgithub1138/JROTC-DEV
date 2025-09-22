import { NewCadet } from '../types';
import { CadetRoleOption } from '@/hooks/useCadetRoles';

export interface CSVProcessorOptions {
  roleOptions: CadetRoleOption[];
  availableGrades: string[];
  availableFlights: string[];
  availableRanks: string[];
  cadetYearOptions: string[];
}

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

export function validateCadetData(cadet: NewCadet, options?: CSVProcessorOptions): string[] {
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
  } else if (options?.roleOptions) {
    // Enhanced role validation when options are available
    const roleExists = options.roleOptions.some(role => 
      role.value === cadet.role_id || 
      role.label.toLowerCase() === cadet.role_id.toLowerCase() ||
      role.role_name.toLowerCase() === cadet.role_id.toLowerCase()
    );
    if (!roleExists) {
      const availableRoles = options.roleOptions.map(r => r.label).join(', ');
      errors.push(`Invalid role "${cadet.role_id}". Available roles: ${availableRoles}`);
    }
  }

  // Grade validation
  if (cadet.grade && options?.availableGrades) {
    if (!options.availableGrades.includes(cadet.grade)) {
      errors.push(`Invalid grade "${cadet.grade}". Available grades: ${options.availableGrades.join(', ')}`);
    }
  }

  // Flight validation
  if (cadet.flight && options?.availableFlights) {
    if (!options.availableFlights.includes(cadet.flight)) {
      errors.push(`Invalid flight "${cadet.flight}". Available flights: ${options.availableFlights.join(', ')}`);
    }
  }

  // Rank validation
  if (cadet.rank && options?.availableRanks) {
    if (!options.availableRanks.includes(cadet.rank)) {
      errors.push(`Invalid rank "${cadet.rank}". Available ranks: ${options.availableRanks.join(', ')}`);
    }
  }

  // Cadet year validation
  if (cadet.cadet_year && options?.cadetYearOptions) {
    if (!options.cadetYearOptions.includes(cadet.cadet_year)) {
      errors.push(`Invalid cadet year "${cadet.cadet_year}". Available years: ${options.cadetYearOptions.join(', ')}`);
    }
  }

  return errors;
}

export function validateCSVHeaders(headers: string[]): string[] {
  const requiredHeaders = ['First Name', 'Last Name', 'Email', 'Role'];
  const optionalHeaders = ['Grade', 'Rank', 'Flight', 'Cadet Year', 'Year', 'Freshman Year', 'Role ID'];
  const validHeaders = [...requiredHeaders, ...optionalHeaders];
  
  const errors: string[] = [];
  
  // Check for required headers (case-insensitive)
  for (const required of requiredHeaders) {
    const found = headers.some(header => 
      header.toLowerCase() === required.toLowerCase()
    );
    if (!found) {
      errors.push(`Missing required column: ${required}`);
    }
  }
  
  // Check for invalid headers (more lenient - only warn about completely unknown patterns)
  for (const header of headers) {
    const isKnown = validHeaders.some(valid => 
      valid.toLowerCase() === header.toLowerCase() ||
      header.toLowerCase().includes('name') ||
      header.toLowerCase().includes('email') ||
      header.toLowerCase().includes('role') ||
      header.toLowerCase().includes('grade') ||
      header.toLowerCase().includes('rank') ||
      header.toLowerCase().includes('flight') ||
      header.toLowerCase().includes('year')
    );
    if (!isKnown) {
      errors.push(`Unknown column: ${header} (will be ignored)`);
    }
  }
  
  return errors;
}

export function convertRoleNameToId(roleName: string, roleOptions: CadetRoleOption[]): string {
  if (!roleName || !roleOptions?.length) return roleName;
  
  // Try to find exact match by value (UUID)
  const exactMatch = roleOptions.find(role => role.value === roleName);
  if (exactMatch) return roleName;
  
  // Try to find by role name (case-insensitive)
  const nameMatch = roleOptions.find(role => 
    role.role_name.toLowerCase() === roleName.toLowerCase()
  );
  if (nameMatch) return nameMatch.value;
  
  // Try to find by role label (case-insensitive)
  const labelMatch = roleOptions.find(role => 
    role.label.toLowerCase() === roleName.toLowerCase()
  );
  if (labelMatch) return labelMatch.value;
  
  // Return original if no match found
  return roleName;
}

export function processCSVCadet(row: Record<string, string>, options: CSVProcessorOptions): NewCadet {
  // Helper function to get case-insensitive value from row
  const getValue = (keys: string[]): string => {
    for (const key of keys) {
      // Try exact match first
      if (row[key]) return row[key];
      // Try case-insensitive match
      const found = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase());
      if (found && row[found]) return row[found];
    }
    return '';
  };

  // Helper function to convert numeric cadet year to ordinal format
  const convertCadetYear = (year: string): string => {
    if (!year) return '';
    const numericYear = year.trim();
    switch (numericYear) {
      case '1': return '1st';
      case '2': return '2nd';
      case '3': return '3rd';
      case '4': return '4th';
      default: return year; // Return as-is if already in correct format
    }
  };

  const rawRole = getValue(['Role', 'Role ID']);
  const rawCadetYear = getValue(['Cadet Year', 'Year']);
  const rawFreshmanYear = getValue(['Freshman Year']);

  return {
    first_name: getValue(['First Name', 'firstname', 'first']),
    last_name: getValue(['Last Name', 'lastname', 'last']),
    email: getValue(['Email', 'email address', 'e-mail']),
    role_id: convertRoleNameToId(rawRole, options.roleOptions),
    grade: getValue(['Grade']),
    rank: getValue(['Rank']),
    flight: getValue(['Flight']),
    cadet_year: convertCadetYear(rawCadetYear),
    start_year: rawFreshmanYear ? parseInt(rawFreshmanYear) : undefined
  };
}