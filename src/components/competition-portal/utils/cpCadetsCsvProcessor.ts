import { CPCadetFormData } from '@/hooks/competition-portal/useCPCadets';

const VALID_GRADES = [
  'Freshman', '9th Grade',
  'Sophomore', '10th Grade',
  'Junior', '11th Grade',
  'Senior', '12th Grade',
  'Graduate'
];

export interface CPCadetCsvRow extends CPCadetFormData {
  isValid: boolean;
  errors: string[];
}

export function parseCSV(csvText: string): CPCadetCsvRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  const rows: CPCadetCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || values.every(v => !v.trim())) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim().replace(/['"]/g, '') || '';
    });

    const cadet = mapRowToCadet(row);
    rows.push(cadet);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function mapRowToCadet(row: Record<string, string>): CPCadetCsvRow {
  const firstName = row['first_name'] || row['firstname'] || row['first name'] || '';
  const lastName = row['last_name'] || row['lastname'] || row['last name'] || '';
  const email = row['email'] || row['email address'] || '';
  const grade = normalizeGrade(row['grade'] || row['class'] || row['year'] || '');

  const errors: string[] = [];

  if (!firstName) errors.push('First name is required');
  if (!lastName) errors.push('Last name is required');
  if (!email) errors.push('Email is required');
  if (email && !isValidEmail(email)) errors.push('Invalid email format');
  if (!grade) errors.push('Grade is required');
  if (grade && !VALID_GRADES.some(g => g.toLowerCase() === grade.toLowerCase())) {
    errors.push(`Invalid grade: ${grade}`);
  }

  return {
    first_name: firstName,
    last_name: lastName,
    email: email,
    grade: grade,
    isValid: errors.length === 0,
    errors,
  };
}

function normalizeGrade(grade: string): string {
  const gradeMap: Record<string, string> = {
    '9': '9th Grade',
    '9th': '9th Grade',
    '9th grade': '9th Grade',
    'freshman': 'Freshman',
    '10': '10th Grade',
    '10th': '10th Grade',
    '10th grade': '10th Grade',
    'sophomore': 'Sophomore',
    '11': '11th Grade',
    '11th': '11th Grade',
    '11th grade': '11th Grade',
    'junior': 'Junior',
    '12': '12th Grade',
    '12th': '12th Grade',
    '12th grade': '12th Grade',
    'senior': 'Senior',
    'graduate': 'Graduate',
    'grad': 'Graduate',
  };

  const normalized = gradeMap[grade.toLowerCase()];
  if (normalized) return normalized;

  // Try to match against valid grades
  const match = VALID_GRADES.find(g => g.toLowerCase() === grade.toLowerCase());
  return match || grade;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateSampleCSV(): string {
  return `first_name,last_name,email,grade
John,Doe,john.doe@email.com,Freshman
Jane,Smith,jane.smith@email.com,Sophomore
Bob,Johnson,bob.johnson@email.com,Junior`;
}
