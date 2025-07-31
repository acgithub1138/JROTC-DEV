export interface NewJudge {
  name: string;
  email?: string;
  phone?: string;
  available: boolean;
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

export function validateJudgeData(judge: NewJudge): string[] {
  const errors: string[] = [];

  // Required field validations
  if (!judge.name.trim()) {
    errors.push('Name is required');
  }

  // Email format validation (optional field)
  if (judge.email && judge.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(judge.email)) {
      errors.push('Invalid email format');
    }
  }

  // Phone format validation (optional field)
  if (judge.phone && judge.phone.trim()) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(judge.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.push('Invalid phone format');
    }
  }

  return errors;
}

export function validateCSVHeaders(headers: string[]): string[] {
  const requiredHeaders = ['Name'];
  const optionalHeaders = ['Email', 'Phone', 'Available'];
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