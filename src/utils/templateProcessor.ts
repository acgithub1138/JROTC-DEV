import { renderToStaticMarkup } from '@usewaypoint/email-builder';

// Render email builder JSON document to HTML
export const renderEmailBuilderDocument = (bodyJson: Record<string, any>): string => {
  try {
    return renderToStaticMarkup(bodyJson as any, { rootBlockId: 'root' });
  } catch (error) {
    console.error('Error rendering email builder document:', error);
    return '<p>Error rendering email</p>';
  }
};

export const processTemplate = (template: string, data: Record<string, any>): string => {
  if (!template || !data) return template;
  
  let result = template;
  
  // Find all variables in the format {{variable_name}} or {{relation.field}}
  const variableRegex = /\{\{([^}]+)\}\}/g;
  let match;
  
  while ((match = variableRegex.exec(template)) !== null) {
    const fullMatch = match[0]; // {{variable_name}}
    const variablePath = match[1].trim(); // variable_name
    
    // Get the value from the data object
    const value = getNestedValue(data, variablePath);
    
    // Format the value if it's a date
    const formattedValue = formatValueForEmail(value, variablePath);
    
    // Replace the variable with the formatted value (or empty string if not found)
    result = result.replace(fullMatch, formattedValue !== undefined ? String(formattedValue) : '');
  }
  
  return result;
};

const getNestedValue = (obj: Record<string, any>, path: string): any => {
  // Handle direct property access first
  if (obj.hasOwnProperty(path)) {
    return obj[path];
  }
  
  // Handle nested property access (e.g., "assigned_to.first_name")
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  
  return current;
};

const formatValueForEmail = (value: any, fieldPath: string): any => {
  if (value === null || value === undefined) {
    return value;
  }
  
  // Enhanced date field detection - matches the database function logic
  const isDateField = fieldPath.toLowerCase().includes('date') || 
                     fieldPath.toLowerCase().includes('_at') ||
                     fieldPath.toLowerCase().includes('_on');
  
  // If it looks like a date field and the value is a string that looks like a date
  if (isDateField && typeof value === 'string') {
    const date = new Date(value);
    // Check if it's a valid date
    if (!isNaN(date.getTime())) {
      // Format as MM/DD/YYYY to match the database function
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    }
  }
  
  return value;
};

export const extractVariables = (template: string): string[] => {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = variableRegex.exec(template)) !== null) {
    const variableName = match[1].trim();
    if (!variables.includes(variableName)) {
      variables.push(variableName);
    }
  }
  
  return variables;
};
