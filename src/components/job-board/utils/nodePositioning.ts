
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
    const tier = parseFloat(job.tier || '1'); // Parse string tier to number, default to 1
    if (!tierGroups.has(tier)) {
      tierGroups.set(tier, []);
    }
    tierGroups.get(tier)!.push(job);
  });

  // Sort tiers to process them in order
  const sortedTiers = Array.from(tierGroups.keys()).sort((a, b) => a - b);
  
  // Calculate Y positions for all tiers first
  const tierYPositions = new Map<number, number>();
  let currentY = 0;
  
  // Group tiers by their base number to handle decimals properly
  const baseTierGroups = new Map<number, number[]>();
  sortedTiers.forEach((tier) => {
    const baseTier = Math.floor(tier);
    if (!baseTierGroups.has(baseTier)) {
      baseTierGroups.set(baseTier, []);
    }
    baseTierGroups.get(baseTier)!.push(tier);
  });
  
  // Process each base tier group
  Array.from(baseTierGroups.keys()).sort((a, b) => a - b).forEach((baseTier) => {
    const tiersInGroup = baseTierGroups.get(baseTier)!.sort((a, b) => a - b);
    
    tiersInGroup.forEach((tier, index) => {
      if (tier === baseTier) {
        // Whole number tier - starts where we left off
        tierYPositions.set(tier, currentY);
        currentY += config.levelHeight; // Standard spacing for whole numbers
      } else {
        // Decimal tier - position sequentially below the base tier
        const baseTierY = tierYPositions.get(baseTier) || currentY;
        // Count how many decimal tiers come before this one in the same base tier
        const decimalIndex = tiersInGroup.filter(t => t > baseTier && t < tier).length + 1;
        const yPosition = baseTierY + (decimalIndex * (config.nodeHeight + 10));
        tierYPositions.set(tier, yPosition);
        
        // Update currentY to be after this decimal tier for the next base tier
        currentY = Math.max(currentY, yPosition + (config.nodeHeight + 10));
      }
    });
  });
  
  // Position nodes within their tiers
  sortedTiers.forEach((tier) => {
    const tierJobs = tierGroups.get(tier)!;
    const yPosition = tierYPositions.get(tier)!;
    
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
