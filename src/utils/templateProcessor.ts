
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
    
    // Replace the variable with the value (or empty string if not found)
    result = result.replace(fullMatch, value !== undefined ? String(value) : '');
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
