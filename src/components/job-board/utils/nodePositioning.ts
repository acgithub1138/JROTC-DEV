
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

// Tier-based positioning using database tier values
const calculateTierBasedPositions = (
  jobs: JobBoardWithCadet[],
  hierarchyNodes: Map<string, HierarchyNode>,
  config: NodePositionConfig,
  savedPositions?: Map<string, { x: number; y: number }>
): Map<string, { x: number; y: number }> => {
  const positions = new Map<string, { x: number; y: number }>();
  
  // Group nodes by tier (from database tier field)
  const tierGroups = new Map<number, JobBoardWithCadet[]>();
  jobs.forEach((job) => {
    const tier = job.tier || 1; // Default to tier 1 if not set
    if (!tierGroups.has(tier)) {
      tierGroups.set(tier, []);
    }
    tierGroups.get(tier)!.push(job);
  });

  // Sort tiers to process them in order
  const sortedTiers = Array.from(tierGroups.keys()).sort((a, b) => a - b);
  
  // Position nodes within their tiers
  sortedTiers.forEach((tier) => {
    const tierJobs = tierGroups.get(tier)!;
    
    // Calculate Y position based on tier (including decimal positions)
    const baseTier = Math.floor(tier);
    const subTier = tier - baseTier;
    const yPosition = baseTier * config.levelHeight + (subTier * (config.levelHeight * 0.6)); // Sub-tiers at 60% spacing
    
    // Group by squadron/flight for better horizontal organization
    const squadronGroups = new Map<string, JobBoardWithCadet[]>();
    tierJobs.forEach(job => {
      // Extract squadron from role (e.g., "Alpha Squadron CC" -> "Alpha")
      const squadronMatch = job.role.match(/(\w+)\s+(Squadron|Flight)/);
      const squadron = squadronMatch ? squadronMatch[1] : 'Staff';
      
      if (!squadronGroups.has(squadron)) {
        squadronGroups.set(squadron, []);
      }
      squadronGroups.get(squadron)!.push(job);
    });
    
    const squadronNames = Array.from(squadronGroups.keys()).sort();
    
    // Calculate total width needed for this tier
    const totalJobs = tierJobs.length;
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
  
  console.log(`📍 Using tier-based layout algorithm for ${jobs.length} jobs`);
  
  return calculateTierBasedPositions(jobs, hierarchyNodes, config, savedPositions);
};
