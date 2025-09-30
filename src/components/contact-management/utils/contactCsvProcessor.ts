export interface ContactCSVData {
  name: string;
  phone?: string;
  email: string;
  cadet?: string;
  cadet_id?: string;
  type: string;
  type_other?: string;
}

export interface ParsedContact extends ContactCSVData {
  id: string;
  errors: string[];
  isValid: boolean;
  status: 'active' | 'semi_active' | 'not_active';
}

const CONTACT_TYPES = ['parent', 'relative', 'friend', 'other'];

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

export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return true; // Phone is optional
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function validateContactData(contact: ContactCSVData | ParsedContact): string[] {
  const errors: string[] = [];

  // Required field validations
  if (!contact.name?.trim()) {
    errors.push('Name is required');
  }

  if (!contact.email?.trim()) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact.email)) {
      errors.push('Invalid email format');
    }
  }

  if (!contact.type?.trim()) {
    errors.push('Type is required');
  } else {
    const normalizedType = contact.type.toLowerCase();
    if (!CONTACT_TYPES.includes(normalizedType)) {
      errors.push(`Invalid type "${contact.type}". Must be one of: ${CONTACT_TYPES.join(', ')}`);
    }
  }

  // Phone validation (optional but must be valid if provided)
  if (contact.phone && !validatePhoneNumber(contact.phone)) {
    errors.push('Phone number must be 10 digits');
  }

  // If a cadet name was provided but no cadet_id was matched, it's invalid
  if (contact.cadet && contact.cadet.trim() !== '' && !contact.cadet_id) {
    errors.push('Cadet not found - select from dropdown');
  }

  return errors;
}

export function processCSVContact(row: Record<string, string>): ContactCSVData {
  const getValue = (keys: string[]): string => {
    for (const key of keys) {
      if (row[key]) return row[key];
      const found = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase());
      if (found && row[found]) return row[found];
    }
    return '';
  };

  const type = getValue(['Type', 'Contact Type']).toLowerCase();
  
  return {
    name: getValue(['Name', 'Contact Name', 'Full Name']),
    phone: formatPhoneNumber(getValue(['Phone', 'Phone Number', 'Contact Phone'])),
    email: getValue(['Email', 'Email Address', 'Contact Email']),
    cadet: getValue(['Cadet', 'Student', 'Cadet Name']),
    type: type as 'parent' | 'relative' | 'friend' | 'other',
    type_other: type === 'other' ? getValue(['Type Other', 'Other Type']) : undefined,
  };
}

export function validateCSVHeaders(headers: string[]): string[] {
  const requiredHeaders = ['Name', 'Email', 'Type'];
  const errors: string[] = [];
  
  for (const required of requiredHeaders) {
    const found = headers.some(header => 
      header.toLowerCase() === required.toLowerCase()
    );
    if (!found) {
      errors.push(`Missing required column: ${required}`);
    }
  }
  
  return errors;
}
