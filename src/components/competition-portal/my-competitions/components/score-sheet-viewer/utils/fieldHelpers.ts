import type { CompetitionEvent } from '../types';

// Get all unique field names from all events and templates
export const getFieldNames = (events: CompetitionEvent[], templates: any[] = []): string[] => {
  const allFieldNames = new Set<string>();
  
  // Get field names from actual scores
  events.forEach(event => {
    if (event.score_sheet?.scores) {
      Object.keys(event.score_sheet.scores).forEach(fieldName => {
        allFieldNames.add(fieldName);
      });
    }
  });
  
  // Also get field names from templates to include empty/zero fields
  events.forEach(event => {
    if (event.score_sheet?.template_id) {
      const template = templates.find(t => t.id === event.score_sheet.template_id);
      if (template?.scores) {
        try {
          const templateScores = typeof template.scores === 'string' 
            ? JSON.parse(template.scores) 
            : template.scores;
          
          if (templateScores?.criteria && Array.isArray(templateScores.criteria)) {
            templateScores.criteria.forEach((field: any) => {
              if (field.id) {
                allFieldNames.add(field.id);
              }
              // Also check for penalty fields that might use different ID patterns
              if (field.name && field.type === 'penalty') {
                // Generate field ID from name for penalty fields
                const penaltyFieldId = `field_${field.name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '')}_penalty`;
                allFieldNames.add(penaltyFieldId);
                
                // Also add potential variations
                if (field.name.toLowerCase().includes('boundary')) {
                  allFieldNames.add('field_boundary_violations_penalty');
                  allFieldNames.add('field_boundary_penalty');
                }
                if (field.name.toLowerCase().includes('time')) {
                  allFieldNames.add('field_seconds_over_under_time_penalty');
                  allFieldNames.add('field_time_penalty');
                }
                if (field.name.toLowerCase().includes('weapon')) {
                  allFieldNames.add('field_dropped_weapons_penalty');
                  allFieldNames.add('field_weapon_penalty');
                }
              }
            });
          }
          
          console.log('Template fields found:', templateScores?.criteria?.map((f: any) => ({ id: f.id, name: f.name, type: f.type })));
        } catch (error) {
          console.warn('Failed to parse template scores:', error);
        }
      }
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