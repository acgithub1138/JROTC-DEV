
import { JobBoardWithCadet } from '../types';
import { LayoutNode } from './intelligentLayout';

export interface CommandLevel {
  level: number;
  roles: string[];
  isCommandLevel: boolean;
  squadronBased: boolean;
}

export interface SquadronStructure {
  name: string;
  commander: string | null;
  members: string[];
  column: number;
}

// Analyze role to determine command level and type
export const analyzeRole = (role: string): {
  level: number;
  isCommand: boolean;
  squadron: string | null;
  roleType: 'group-command' | 'group-staff' | 'squadron-command' | 'squadron-staff' | 'specialist';
} => {
  const lowerRole = role.toLowerCase();
  
  // Group-level command
  if (lowerRole.includes('group commander') || lowerRole.includes('group cc')) {
    return { level: 0, isCommand: true, squadron: null, roleType: 'group-command' };
  }
  
  if (lowerRole.includes('deputy group commander') || lowerRole.includes('deputy group cc')) {
    return { level: 0, isCommand: true, squadron: null, roleType: 'group-command' };
  }
  
  // Group staff
  if (lowerRole.includes('group superintendent') || 
      lowerRole.includes('inspector general') || 
      lowerRole.includes('executive officer') ||
      lowerRole.includes('plans and programs')) {
    return { level: 1, isCommand: false, squadron: null, roleType: 'group-staff' };
  }
  
  // Squadron commanders
  if ((lowerRole.includes('squadron') || lowerRole.includes('sq')) && 
      (lowerRole.includes('commander') || lowerRole.includes('cc'))) {
    const squadron = extractSquadronName(role);
    return { level: 2, isCommand: true, squadron, roleType: 'squadron-command' };
  }
  
  // Squadron deputies/flight commanders
  if ((lowerRole.includes('deputy') || lowerRole.includes('flight')) && 
      (lowerRole.includes('commander') || lowerRole.includes('cc'))) {
    const squadron = extractSquadronName(role);
    return { level: 3, isCommand: true, squadron, roleType: 'squadron-staff' };
  }
  
  // Default classification based on squadron affiliation
  const squadron = extractSquadronName(role);
  if (squadron) {
    return { level: 4, isCommand: false, squadron, roleType: 'squadron-staff' };
  }
  
  return { level: 4, isCommand: false, squadron: null, roleType: 'specialist' };
};

const extractSquadronName = (role: string): string | null => {
  const lowerRole = role.toLowerCase();
  
  if (lowerRole.includes('maintenance') || lowerRole.includes('mx')) return 'maintenance';
  if (lowerRole.includes('operations') || lowerRole.includes('ops')) return 'operations';
  if (lowerRole.includes('support') || lowerRole.includes('spt')) return 'support';
  if (lowerRole.includes('mission') || lowerRole.includes('msn')) return 'mission';
  if (lowerRole.includes('security') || lowerRole.includes('sec')) return 'security';
  if (lowerRole.includes('communications') || lowerRole.includes('comm')) return 'communications';
  
  return null;
};

// Build squadron structures for layout
export const buildSquadronStructures = (jobs: JobBoardWithCadet[]): Map<string, SquadronStructure> => {
  const squadrons = new Map<string, SquadronStructure>();
  
  // First pass: identify squadrons and their commanders
  jobs.forEach(job => {
    const analysis = analyzeRole(job.role);
    if (analysis.squadron) {
      if (!squadrons.has(analysis.squadron)) {
        squadrons.set(analysis.squadron, {
          name: analysis.squadron,
          commander: null,
          members: [],
          column: 0
        });
      }
      
      const squadron = squadrons.get(analysis.squadron)!;
      if (analysis.roleType === 'squadron-command') {
        squadron.commander = job.id;
      }
      squadron.members.push(job.id);
    }
  });
  
  // Assign column positions
  let columnIndex = 0;
  squadrons.forEach(squadron => {
    squadron.column = columnIndex++;
  });
  
  return squadrons;
};

// Create enhanced layout nodes with command structure awareness
export const createEnhancedLayoutNodes = (
  jobs: JobBoardWithCadet[],
  squadronStructures: Map<string, SquadronStructure>
): Map<string, LayoutNode> => {
  const layoutNodes = new Map<string, LayoutNode>();
  
  jobs.forEach(job => {
    const analysis = analyzeRole(job.role);
    const squadron = analysis.squadron ? squadronStructures.get(analysis.squadron) : null;
    
    // Determine children based on reporting structure
    const children = jobs
      .filter(otherJob => otherJob.reports_to === job.role)
      .map(child => child.id);
    
    // Find parent
    let parent: string | undefined;
    if (job.reports_to && job.reports_to !== 'NA') {
      const parentJob = jobs.find(j => j.role === job.reports_to);
      if (parentJob) parent = parentJob.id;
    }
    
    const layoutNode: LayoutNode = {
      id: job.id,
      job,
      level: analysis.level,
      children,
      parent,
      isAssistant: job.assistant && job.assistant !== 'NA',
      squadron: analysis.squadron || 'general',
      width: 300,
      height: 120,
    };
    
    layoutNodes.set(job.id, layoutNode);
  });
  
  return layoutNodes;
};
