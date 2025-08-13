import type { CompetitionEvent } from '../types';

// Get all unique field names from all events
export const getFieldNames = (events: CompetitionEvent[]): string[] => {
  const allFieldNames = new Set<string>();
  
  events.forEach(event => {
    if (event.score_sheet?.scores) {
      Object.keys(event.score_sheet.scores).forEach(fieldName => {
        // Include all fields including penalty fields
        allFieldNames.add(fieldName);
      });
    }
  });
  
  return Array.from(allFieldNames).sort((a, b) => {
    // Extract number from field_x_ pattern for proper sorting  
    const getNumber = (str: string) => {
      const match = str.match(/^field_(\d+)/);
      return match ? parseInt(match[1]) : 999; // Non-numbered fields go to end
    };
    
    const aNum = getNumber(a);
    const bNum = getNumber(b);
    
    // If both have the same field number, sort penalty fields after regular fields
    if (aNum === bNum) {
      const aIsPenalty = a.includes('penalty') || a.includes('_pen_');
      const bIsPenalty = b.includes('penalty') || b.includes('_pen_');
      
      if (aIsPenalty && !bIsPenalty) return 1;
      if (!aIsPenalty && bIsPenalty) return -1;
      return a.localeCompare(b);
    }
    
    return aNum - bNum;
  });
};

// Clean field name for display
export const getCleanFieldName = (fieldName: string): string => {
  return fieldName
    .replace(/^field_\d+_/, '') // Remove field_x_ prefix
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim();
};

// Calculate average for a specific field
export const calculateFieldAverage = (events: CompetitionEvent[], fieldName: string): string => {
  const values = events
    .map(event => event.score_sheet?.scores?.[fieldName])
    .filter(value => value !== null && value !== undefined && !isNaN(Number(value)))
    .map(value => Number(value));
  
  if (values.length === 0) return '-';
  
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return average.toFixed(1);
};

// Calculate total average
export const calculateTotalAverage = (events: CompetitionEvent[]): string => {
  const totals = events
    .map(event => event.total_points)
    .filter(total => total !== null && total !== undefined && !isNaN(Number(total)))
    .map(total => Number(total));
  
  if (totals.length === 0) return '0';
  
  const average = totals.reduce((sum, total) => sum + total, 0) / totals.length;
  return average.toFixed(1);
};