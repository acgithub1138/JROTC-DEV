
import { JobBoardWithCadet } from '../types';
import { HierarchyNode } from './hierarchyBuilder';

export interface NodePositionConfig {
  nodeWidth: number;
  nodeHeight: number;
  levelHeight: number;
  nodeSpacing: number;
}

export const DEFAULT_POSITION_CONFIG: NodePositionConfig = {
  nodeWidth: 300,
  nodeHeight: 120,
  levelHeight: 200,
  nodeSpacing: 50,
};

// Legacy hierarchical positioning based on reports_to relationships
const calculateHierarchicalPositions = (
  jobs: JobBoardWithCadet[],
  hierarchyNodes: Map<string, HierarchyNode>,
  config: NodePositionConfig,
  savedPositions?: Map<string, { x: number; y: number }>
): Map<string, { x: number; y: number }> => {
  const positions = new Map<string, { x: number; y: number }>();
  
  // Group nodes by their hierarchy level
  const levelGroups = new Map<number, JobBoardWithCadet[]>();
  jobs.forEach((job) => {
    const hierarchyNode = hierarchyNodes.get(job.id);
    const level = hierarchyNode?.level || 0;
    
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(job);
  });

  // Sort levels to process them in order
  const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
  
  // Position nodes level by level
  sortedLevels.forEach((level) => {
    const levelJobs = levelGroups.get(level)!;
    const yPosition = level * config.levelHeight;
    
    // Group by squadron/flight for better horizontal organization
    const squadronGroups = new Map<string, JobBoardWithCadet[]>();
    levelJobs.forEach(job => {
      // Extract squadron from role (e.g., "Alpha Squadron CC" -> "Alpha")
      const squadronMatch = job.role.match(/(\w+)\s+(Squadron|Flight)/);
      const squadron = squadronMatch ? squadronMatch[1] : 'Staff';
      
      if (!squadronGroups.has(squadron)) {
        squadronGroups.set(squadron, []);
      }
      squadronGroups.get(squadron)!.push(job);
    });
    
    const squadronNames = Array.from(squadronGroups.keys()).sort();
    
    // Calculate total width needed for this level
    const totalJobs = levelJobs.length;
    const totalWidth = totalJobs * (config.nodeWidth + config.nodeSpacing) - config.nodeSpacing;
    const startX = -totalWidth / 2;
    
    let jobIndex = 0;
    squadronNames.forEach((squadron) => {
      const squadronJobs = squadronGroups.get(squadron)!;
      
      squadronJobs.forEach((job) => {
        let xPosition = startX + jobIndex * (config.nodeWidth + config.nodeSpacing);
        
        // Special positioning for assistant roles
        if (job.assistant && job.assistant !== 'NA') {
          const supervisorJob = jobs.find(j => j.role === job.assistant);
          if (supervisorJob) {
            const supervisorPosition = positions.get(supervisorJob.id);
            if (supervisorPosition) {
              xPosition = supervisorPosition.x + config.nodeWidth + 20; // Closer to supervisor
            }
          }
        }
        
        // Use saved position if available, otherwise use calculated position
        const savedPosition = savedPositions?.get(job.id);
        const position = savedPosition || {
          x: xPosition,
          y: yPosition,
        };
        
        positions.set(job.id, position);
        jobIndex++;
      });
    });
  });

  return positions;
};

export const calculateNodePositions = (
  jobs: JobBoardWithCadet[],
  hierarchyNodes: Map<string, HierarchyNode>,
  config: NodePositionConfig = DEFAULT_POSITION_CONFIG,
  savedPositions?: Map<string, { x: number; y: number }>
): Map<string, { x: number; y: number }> => {
  
  console.log(`📍 Using legacy hierarchical layout algorithm for ${jobs.length} jobs`);
  
  return calculateHierarchicalPositions(jobs, hierarchyNodes, config, savedPositions);
};
